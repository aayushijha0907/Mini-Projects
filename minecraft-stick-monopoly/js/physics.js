/**
 * Physics Engine - 2.5D Dice Simulation & Dynamic Token Movement
 * Handles tumbling dice collisions with stick borders, parabolic token hopping,
 * squash-and-stretch deformations, and interactive drag-and-drop physics.
 */

class PhysicsEngine {
    constructor() {
        this.dice = [];
        this.tokens = new Map(); // playerId -> TokenPhysics
        this.particles = [];
        this.diceTray = { minX: 250, maxX: 550, minY: 250, maxY: 550 };
        this.gravity = 2400; // px/s^2 for 2.5D height
        this.isRolling = false;
        this.rollCallback = null;
        this.draggedToken = null;
        this.dragMouse = { x: 0, y: 0, vx: 0, vy: 0, lastX: 0, lastY: 0, lastTime: 0 };
    }

    initDice(trayBounds) {
        this.diceTray = trayBounds;
        const cx = (trayBounds.minX + trayBounds.maxX) / 2;
        const cy = (trayBounds.minY + trayBounds.maxY) / 2;

        this.dice = [
            {
                id: 1,
                x: cx - 45,
                y: cy,
                z: 0,
                vx: 0,
                vy: 0,
                vz: 0,
                angle: 0.1,
                vAngle: 0,
                size: 42,
                faceValue: 1,
                targetValue: 1,
                isSettled: true,
                bounces: 0
            },
            {
                id: 2,
                x: cx + 45,
                y: cy,
                z: 0,
                vx: 0,
                vy: 0,
                vz: 0,
                angle: -0.15,
                vAngle: 0,
                size: 42,
                faceValue: 2,
                targetValue: 2,
                isSettled: true,
                bounces: 0
            }
        ];
    }

    updateDiceTray(bounds) {
        this.diceTray = bounds;
    }

    /**
     * Start a physics-driven dice roll with predetermined or random targets
     */
    rollDice(targetVal1, targetVal2, onComplete) {
        if (this.isRolling) return;
        this.isRolling = true;
        this.rollCallback = onComplete;

        Sound.playStickClick(1.3, 1.0);

        const cx = (this.diceTray.minX + this.diceTray.maxX) / 2;
        const cy = (this.diceTray.minY + this.diceTray.maxY) / 2;

        this.dice.forEach((die, idx) => {
            die.isSettled = false;
            die.bounces = 0;
            die.targetValue = idx === 0 ? targetVal1 : targetVal2;
            die.x = cx + (idx === 0 ? -50 : 50) + (Math.random() * 20 - 10);
            die.y = cy + (Math.random() * 20 - 10);
            die.z = 80 + Math.random() * 40; // Toss high into the air
            
            // Random explosive impulse
            const angle = Math.random() * Math.PI * 2;
            const speed = 400 + Math.random() * 350;
            die.vx = Math.cos(angle) * speed;
            die.vy = Math.sin(angle) * speed;
            die.vz = 250 + Math.random() * 200; // upward toss
            die.vAngle = (Math.random() * 18 - 9); // fast rotational spin
        });
    }

    /**
     * Register or update a player token in physics system
     */
    registerToken(player) {
        let token = this.tokens.get(player.id);
        if (!token) {
            token = {
                id: player.id,
                tileIndex: player.position,
                x: 0,
                y: 0,
                targetX: 0,
                targetY: 0,
                z: 0,
                vz: 0,
                scaleX: 1.0,
                scaleY: 1.0,
                tilt: 0,
                isHopping: false,
                hopQueue: [],
                currentHop: null,
                isDragging: false,
                dragOffsetX: 0,
                dragOffsetY: 0
            };
            this.tokens.set(player.id, token);
        }
        return token;
    }

    /**
     * Queue physical hops tile-by-tile for a token
     */
    hopTokenTo(playerId, targetTile, hopPositions, onFinish) {
        const token = this.tokens.get(playerId);
        if (!token) return;

        token.hopQueue = hopPositions.map((pos, i) => ({
            tile: pos.tileIndex,
            targetX: pos.x,
            targetY: pos.y,
            isLast: i === hopPositions.length - 1
        }));
        token.onFinishHops = onFinish;
        token.isHopping = true;
    }

    /**
     * Update physics simulation step
     */
    update(dt) {
        // Cap dt to avoid huge steps on tab switch
        const delta = Math.min(dt, 0.05);

        // 1. Update Dice Physics
        this.updateDice(delta);

        // 2. Update Token Physics & Hops
        this.updateTokens(delta);

        // 3. Update Particles
        this.updateParticles(delta);
    }

    updateDice(dt) {
        let allSettled = true;

        for (let i = 0; i < this.dice.length; i++) {
            const die = this.dice[i];
            if (die.isSettled) continue;

            allSettled = false;

            // Height & vertical gravity
            die.vz -= this.gravity * dt;
            die.z += die.vz * dt;

            // Floor collision
            if (die.z <= 0) {
                die.z = 0;
                die.bounces++;
                const impactVel = Math.abs(die.vz);

                if (impactVel > 60) {
                    die.vz = -die.vz * 0.45; // Restitution
                    Sound.playDiceBounce(Math.min(1.0, impactVel / 500));
                    this.createDustParticles(die.x, die.y, 4, '#8a5c36');
                } else {
                    die.vz = 0;
                }

                // Ground friction
                die.vx *= 0.88;
                die.vy *= 0.88;
                die.vAngle *= 0.82;
            } else {
                // Air resistance
                die.vx *= 0.99;
                die.vy *= 0.99;
                // While airborne, cycle face values for tumble effect
                if (Math.random() < 0.25) {
                    die.faceValue = Math.floor(Math.random() * 6) + 1;
                }
            }

            // Linear position
            die.x += die.vx * dt;
            die.y += die.vy * dt;
            die.angle += die.vAngle * dt;

            // Wooden Stick Border Collisions
            const half = die.size / 2;
            if (die.x - half < this.diceTray.minX) {
                die.x = this.diceTray.minX + half;
                die.vx = -die.vx * 0.7;
                die.vAngle += (Math.random() - 0.5) * 4;
                Sound.playDiceBounce(Math.abs(die.vx) / 300);
            } else if (die.x + half > this.diceTray.maxX) {
                die.x = this.diceTray.maxX - half;
                die.vx = -die.vx * 0.7;
                die.vAngle += (Math.random() - 0.5) * 4;
                Sound.playDiceBounce(Math.abs(die.vx) / 300);
            }

            if (die.y - half < this.diceTray.minY) {
                die.y = this.diceTray.minY + half;
                die.vy = -die.vy * 0.7;
                die.vAngle += (Math.random() - 0.5) * 4;
                Sound.playDiceBounce(Math.abs(die.vy) / 300);
            } else if (die.y + half > this.diceTray.maxY) {
                die.y = this.diceTray.maxY - half;
                die.vy = -die.vy * 0.7;
                die.vAngle += (Math.random() - 0.5) * 4;
                Sound.playDiceBounce(Math.abs(die.vy) / 300);
            }

            // Settle threshold
            if (die.z === 0 && Math.abs(die.vx) < 15 && Math.abs(die.vy) < 15 && Math.abs(die.vAngle) < 0.3) {
                die.vx = 0;
                die.vy = 0;
                die.vAngle = 0;
                die.faceValue = die.targetValue;
                // Snap angle cleanly to nearest 90 deg with slight organic wood slant
                die.angle = Math.round(die.angle / (Math.PI / 2)) * (Math.PI / 2) + 0.05;
                die.isSettled = true;
            }
        }

        // Inter-dice collision
        if (this.dice.length === 2 && !this.dice[0].isSettled && !this.dice[1].isSettled) {
            const d1 = this.dice[0];
            const d2 = this.dice[1];
            const dx = d2.x - d1.x;
            const dy = d2.y - d1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = (d1.size + d2.size) * 0.55;

            if (dist < minDist && dist > 0.01) {
                const nx = dx / dist;
                const ny = dy / dist;
                const overlap = minDist - dist;

                d1.x -= nx * overlap * 0.5;
                d1.y -= ny * overlap * 0.5;
                d2.x += nx * overlap * 0.5;
                d2.y += ny * overlap * 0.5;

                // Simple elastic collision impulse
                const kx = d1.vx - d2.vx;
                const ky = d1.vy - d2.vy;
                const p = 2 * (nx * kx + ny * ky) / 2;

                d1.vx -= p * nx * 0.8;
                d1.vy -= p * ny * 0.8;
                d2.vx += p * nx * 0.8;
                d2.vy += p * ny * 0.8;

                Sound.playDiceBounce(0.6);
            }
        }

        // If all dice settled just now, trigger callback
        if (this.isRolling && allSettled) {
            this.isRolling = false;
            if (this.rollCallback) {
                const cb = this.rollCallback;
                this.rollCallback = null;
                setTimeout(() => cb(this.dice[0].faceValue, this.dice[1].faceValue), 150);
            }
        }
    }

    updateTokens(dt) {
        this.tokens.forEach(token => {
            if (token.isDragging) {
                // Token lifted by user
                token.z += (30 - token.z) * 12 * dt;
                token.scaleX += (1.05 - token.scaleX) * 10 * dt;
                token.scaleY += (1.05 - token.scaleY) * 10 * dt;
                token.tilt = Math.max(-0.3, Math.min(0.3, this.dragMouse.vx * 0.001));
                return;
            }

            // Normal grounded physics / spring settling
            if (!token.isHopping) {
                // If not hopping, fall to z=0 with bounce
                if (token.z > 0) {
                    token.vz -= this.gravity * dt;
                    token.z += token.vz * dt;
                    if (token.z <= 0) {
                        token.z = 0;
                        if (Math.abs(token.vz) > 50) {
                            token.vz = -token.vz * 0.35;
                            Sound.playStickClick(1.0, 0.6);
                            this.createDustParticles(token.x, token.y, 3, '#734e30');
                        } else {
                            token.vz = 0;
                        }
                    }
                }

                // Spring toward target slot position
                const dx = token.targetX - token.x;
                const dy = token.targetY - token.y;
                token.x += dx * 14 * dt;
                token.y += dy * 14 * dt;

                // Return scale & tilt to 1
                token.scaleX += (1.0 - token.scaleX) * 12 * dt;
                token.scaleY += (1.0 - token.scaleY) * 12 * dt;
                token.tilt += (0 - token.tilt) * 12 * dt;
                return;
            }

            // Executing a hop step
            if (!token.currentHop && token.hopQueue.length > 0) {
                const next = token.hopQueue.shift();
                token.currentHop = {
                    startX: token.x,
                    startY: token.y,
                    endX: next.targetX,
                    endY: next.targetY,
                    tile: next.tile,
                    isLast: next.isLast,
                    progress: 0,
                    duration: 0.18 // Fast crisp wooden jump
                };
                Sound.playStickClick(1.1 + Math.random() * 0.2, 0.4);
            }

            if (token.currentHop) {
                const hop = token.currentHop;
                hop.progress += dt / hop.duration;

                if (hop.progress >= 1.0) {
                    // Hop completed - land!
                    token.x = hop.endX;
                    token.y = hop.endY;
                    token.z = 0;
                    token.vz = 0;
                    token.tileIndex = hop.tile;
                    
                    // Squash upon landing
                    token.scaleX = 1.22;
                    token.scaleY = 0.78;
                    Sound.playStickClick(0.9, hop.isLast ? 0.9 : 0.45);
                    this.createDustParticles(token.x, token.y, hop.isLast ? 6 : 3, '#6e4526');

                    token.currentHop = null;

                    // If finished all hops
                    if (token.hopQueue.length === 0) {
                        token.isHopping = false;
                        if (token.onFinishHops) {
                            const cb = token.onFinishHops;
                            token.onFinishHops = null;
                            setTimeout(() => cb(), 100);
                        }
                    }
                } else {
                    const t = hop.progress;
                    // Horizontal linear interpolation
                    token.x = hop.startX + (hop.endX - hop.startX) * t;
                    token.y = hop.startY + (hop.endY - hop.startY) * t;

                    // Vertical parabolic arc
                    const maxH = 28; // peak jump height
                    token.z = 4 * maxH * t * (1 - t);

                    // Stretch during ascent, squash at apex
                    if (t < 0.5) {
                        token.scaleX = 0.85;
                        token.scaleY = 1.18; // stretch tall
                    } else {
                        token.scaleX = 1.08;
                        token.scaleY = 0.92;
                    }
                    token.tilt = Math.sin(t * Math.PI) * 0.15;
                }
            }
        });
    }

    createDustParticles(x, y, count, color = '#734e30') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 25 + Math.random() * 45;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 15,
                color,
                size: 2.5 + Math.random() * 3,
                life: 1.0,
                decay: 2.0 + Math.random() * 1.5
            });
        }
    }

    createSparkleParticles(x, y, count = 10, color = '#34eb77') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 70;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 20,
                color,
                size: 3 + Math.random() * 3,
                life: 1.0,
                decay: 1.5
            });
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 150 * dt; // gravity
            p.life -= p.decay * dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Mouse / Touch interaction handlers for dragging tokens
     */
    startDrag(mouseX, mouseY) {
        // Find if user clicked on any token
        for (const token of this.tokens.values()) {
            if (token.isHopping) continue;
            const dx = mouseX - token.x;
            const dy = mouseY - (token.y - token.z);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 26) {
                this.draggedToken = token;
                token.isDragging = true;
                token.dragOffsetX = token.x - mouseX;
                token.dragOffsetY = token.y - mouseY;
                this.dragMouse.lastX = mouseX;
                this.dragMouse.lastY = mouseY;
                this.dragMouse.lastTime = performance.now();
                Sound.playStickClick(1.2, 0.6);
                return token;
            }
        }
        return null;
    }

    onDragMove(mouseX, mouseY) {
        if (!this.draggedToken) return;

        const now = performance.now();
        const dt = Math.max(1, now - this.dragMouse.lastTime) / 1000;
        this.dragMouse.vx = (mouseX - this.dragMouse.lastX) / dt;
        this.dragMouse.vy = (mouseY - this.dragMouse.lastY) / dt;
        this.dragMouse.lastX = mouseX;
        this.dragMouse.lastY = mouseY;
        this.dragMouse.lastTime = now;

        this.draggedToken.x = mouseX + this.draggedToken.dragOffsetX;
        this.draggedToken.y = mouseY + this.draggedToken.dragOffsetY;
    }

    endDrag() {
        if (!this.draggedToken) return null;
        const token = this.draggedToken;
        token.isDragging = false;
        token.vz = 40; // slight drop impulse
        Sound.playStickClick(0.9, 0.8);
        this.draggedToken = null;
        return token;
    }
}

// Global Physics Engine singleton
const Physics = new PhysicsEngine();
