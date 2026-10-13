/**
 * Board Renderer - HTML5 Canvas Engine
 * Procedurally draws the rustic stick border, twine corner joints, weathered
 * parchment tiles, Minecraft icons, wooden player tokens, dynamic shadows, and dice pit.
 */

// Polyfill for Canvas roundRect across all browsers
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
        if (!radii) radii = 0;
        if (typeof radii === 'number') radii = [radii, radii, radii, radii];
        const r = radii[0] || 0;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

class BoardRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.boardSize = 920; // Internal coordinate resolution (square)
        this.tileCoords = []; // Cached tile bounding boxes and centers
        this.hoveredTile = null;
        this.hoveredToken = null;
        this.selectedTile = null;
        this.themeGrainPattern = null;

        // Stick border parameters
        this.logWidth = 42;
        this.innerMargin = 40;
        this.dicePitBounds = { minX: 300, maxX: 620, minY: 300, maxY: 620 };

        this.computeTileCoordinates();
    }

    /**
     * Compute grid layout coordinates for all 40 tiles
     */
    computeTileCoordinates() {
        this.tileCoords = [];
        const size = this.boardSize;
        const cornerSize = 115;
        const innerSide = size - 2 * cornerSize;
        const tileWidth = innerSide / 9; // 9 properties per side between corners

        // Helper to store tile rect & token anchor
        const addTile = (id, x, y, w, h, orientation) => {
            this.tileCoords[id] = {
                id,
                x,
                y,
                w,
                h,
                orientation, // 'bottom', 'left', 'top', 'right', 'corner'
                centerX: x + w / 2,
                centerY: y + h / 2,
                tokenAnchor: { x: x + w / 2, y: y + h / 2 }
            };
        };

        // 0: Bottom-Right Corner (GO / Spawn Point)
        addTile(0, size - cornerSize, size - cornerSize, cornerSize, cornerSize, 'corner');

        // 1 to 9: Bottom Row (Right to Left)
        for (let i = 1; i <= 9; i++) {
            const x = size - cornerSize - i * tileWidth;
            const y = size - cornerSize;
            addTile(i, x, y, tileWidth, cornerSize, 'bottom');
        }

        // 10: Bottom-Left Corner (Bedrock Prison)
        addTile(10, 0, size - cornerSize, cornerSize, cornerSize, 'corner');

        // 11 to 19: Left Column (Bottom to Top)
        for (let i = 1; i <= 9; i++) {
            const x = 0;
            const y = size - cornerSize - i * tileWidth;
            addTile(10 + i, x, y, cornerSize, tileWidth, 'left');
        }

        // 20: Top-Left Corner (Village Haven)
        addTile(20, 0, 0, cornerSize, cornerSize, 'corner');

        // 21 to 29: Top Row (Left to Right)
        for (let i = 1; i <= 9; i++) {
            const x = cornerSize + (i - 1) * tileWidth;
            const y = 0;
            addTile(20 + i, x, y, tileWidth, cornerSize, 'top');
        }

        // 30: Top-Right Corner (Warden Ambush / Go To Jail)
        addTile(30, size - cornerSize, 0, cornerSize, cornerSize, 'corner');

        // 31 to 39: Right Column (Top to Bottom)
        for (let i = 1; i <= 9; i++) {
            const x = size - cornerSize;
            const y = cornerSize + (i - 1) * tileWidth;
            addTile(30 + i, x, y, cornerSize, tileWidth, 'right');
        }

        // Central Dice Pit bounds
        this.dicePitBounds = {
            minX: cornerSize + 35,
            maxX: size - cornerSize - 35,
            minY: cornerSize + 35,
            maxY: size - cornerSize - 35
        };
        Physics.updateDiceTray(this.dicePitBounds);
    }

    /**
     * Get position for a token on a tile, offsetting if multiple tokens share the space
     */
    getTokenPositionOnTile(tileIndex, tokenIndexOnTile, totalOnTile) {
        const coord = this.tileCoords[tileIndex];
        if (!coord) return { x: 460, y: 460 };

        if (totalOnTile <= 1) {
            return { x: coord.centerX, y: coord.centerY + (coord.orientation === 'bottom' ? 5 : 0) };
        }

        // Arrange in a small neat ring / cluster
        const angle = (tokenIndexOnTile / totalOnTile) * Math.PI * 2;
        const radius = Math.min(coord.w, coord.h) * 0.22;
        return {
            x: coord.centerX + Math.cos(angle) * radius,
            y: coord.centerY + Math.sin(angle) * radius
        };
    }

    /**
     * Main Render Method (Called at 60 FPS)
     */
    render(gameState) {
        const ctx = this.ctx;
        const size = this.boardSize;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // 1. Draw Board Background (Weathered Tabletop Craft Felt & Burlap)
        this.drawTabletopBackground(ctx, size);

        // 2. Draw Center Dice Pit & Minecraft Logo
        this.drawCenterPit(ctx, gameState);

        // 3. Draw 40 Tiles
        this.drawAllTiles(ctx, gameState);

        // 4. Draw Stick Grid Dividers & Twine Ties
        this.drawStickGrid(ctx, size);

        // 5. Draw Outer Framing Logs & Corner Twine Ties
        this.drawOuterStickFrame(ctx, size);

        // 6. Draw Property Improvements (Wooden Huts & Nether Beacons)
        this.drawPropertyHouses(ctx, gameState);

        // 7. Draw Physical Dice in the Pit
        this.drawDice(ctx);

        // 8. Draw Player Tokens with dynamic shadows and physics elevations
        this.drawTokens(ctx, gameState);

        // 9. Draw Particle FX (dust, sparks)
        this.drawParticles(ctx);

        // 10. Draw Hover / Selection Highlight
        if (this.selectedTile !== null) {
            this.drawTileHighlight(ctx, this.selectedTile, '#e6c845');
        } else if (this.hoveredTile !== null) {
            this.drawTileHighlight(ctx, this.hoveredTile, 'rgba(255, 230, 150, 0.4)');
        }
    }

    /**
     * Background Tabletop Material (burlap / kraft paper / wooden desk)
     */
    drawTabletopBackground(ctx, size) {
        // Rustic wooden desk floor gradient
        const grad = ctx.createRadialGradient(size / 2, size / 2, 100, size / 2, size / 2, size * 0.7);
        grad.addColorStop(0, '#d8bc8c');
        grad.addColorStop(0.7, '#c6a46e');
        grad.addColorStop(1, '#a37f4a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        // Subtle parchment texture grain
        ctx.fillStyle = 'rgba(100, 70, 30, 0.04)';
        for (let i = 0; i < size; i += 8) {
            ctx.fillRect(i, 0, 2, size);
            ctx.fillRect(0, i, size, 2);
        }
    }

    /**
     * Center Board: Wooden stick tray, The Minecraft Chronicles Branding & Pot
     */
    drawCenterPit(ctx, gameState) {
        const pit = this.dicePitBounds;
        const w = pit.maxX - pit.minX;
        const h = pit.maxY - pit.minY;

        // Inner tray depression shadow
        ctx.save();
        ctx.fillStyle = '#bda072';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 4;
        ctx.fillRect(pit.minX, pit.minY, w, h);
        ctx.restore();

        // Inner tray felt texture
        ctx.fillStyle = '#c7ab7d';
        ctx.fillRect(pit.minX + 4, pit.minY + 4, w - 8, h - 8);

        // Stick fence around dice pit
        this.drawProceduralStick(ctx, pit.minX, pit.minY, pit.maxX, pit.minY, 14, '#54361e');
        this.drawProceduralStick(ctx, pit.maxX, pit.minY, pit.maxX, pit.maxY, 14, '#472d18');
        this.drawProceduralStick(ctx, pit.maxX, pit.maxY, pit.minX, pit.maxY, 14, '#54361e');
        this.drawProceduralStick(ctx, pit.minX, pit.maxY, pit.minX, pit.minY, 14, '#472d18');

        // Twine knots at the 4 dice pit corners
        this.drawTwineKnot(ctx, pit.minX, pit.minY, 12);
        this.drawTwineKnot(ctx, pit.maxX, pit.minY, 12);
        this.drawTwineKnot(ctx, pit.maxX, pit.maxY, 12);
        this.drawTwineKnot(ctx, pit.minX, pit.maxY, 12);

        // Handcrafted Minecraft Branding
        const cx = (pit.minX + pit.maxX) / 2;
        const cy = (pit.minY + pit.maxY) / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title carved into wood
        ctx.font = 'bold 22px "Trebuchet MS", "Impact", sans-serif';
        ctx.fillStyle = 'rgba(60, 35, 15, 0.25)';
        ctx.fillText("THE MINECRAFT CHRONICLES", cx + 2, cy - 88);
        ctx.fillStyle = '#4a2e16';
        ctx.fillText("THE MINECRAFT CHRONICLES", cx, cy - 90);

        // Subtitle banner
        ctx.font = 'italic 15px "Georgia", serif';
        ctx.fillStyle = '#6e4726';
        ctx.fillText("~ Handcrafted Stick & Twine Edition ~", cx, cy - 65);

        // Center Pixel Art: Emerald Ore Block carved in wood
        this.drawPixelEmeraldBlock(ctx, cx, cy - 15, 46);

        // Community Pot Status (Village Safe Haven Pool)
        ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
        ctx.fillStyle = '#1e5e2e';
        const pot = gameState ? gameState.villagePot || 0 : 0;
        ctx.fillText(`Safe Haven Pot: ${pot} 🟩 Emeralds`, cx, cy + 50);

        // Hint for interactive dice / tokens
        ctx.font = '12px "Trebuchet MS", sans-serif';
        ctx.fillStyle = '#7a5a3a';
        ctx.fillText("Click 'Roll Dice' or drag your wooden token freely!", cx, cy + 95);

        ctx.restore();
    }

    /**
     * Draw decorative pixel emerald block
     */
    drawPixelEmeraldBlock(ctx, x, y, size) {
        const half = size / 2;
        ctx.save();
        // Stone block background
        ctx.fillStyle = '#6d6860';
        ctx.fillRect(x - half, y - half, size, size);

        // Bevel highlight & shadow
        ctx.fillStyle = '#878177';
        ctx.fillRect(x - half, y - half, size, 4);
        ctx.fillRect(x - half, y - half, 4, size);

        ctx.fillStyle = '#4f4a43';
        ctx.fillRect(x - half, y + half - 4, size, 4);
        ctx.fillRect(x + half - 4, y - half, 4, size);

        // Glowing Emerald flecks
        const flecks = [
            [-8, -8], [6, -6], [-5, 7], [8, 8], [0, 0]
        ];
        flecks.forEach(([fx, fy]) => {
            ctx.fillStyle = '#17bf4b';
            ctx.fillRect(x + fx - 4, y + fy - 4, 8, 8);
            ctx.fillStyle = '#55ff88';
            ctx.fillRect(x + fx - 2, y + fy - 2, 4, 4);
        });

        ctx.restore();
    }

    /**
     * Draw all 40 tiles with parchment cards and icons
     */
    drawAllTiles(ctx, gameState) {
        for (let i = 0; i < 40; i++) {
            const tile = BOARD_TILES[i];
            const coord = this.tileCoords[i];
            if (!coord) continue;

            ctx.save();

            // Parchment tile card base
            ctx.fillStyle = '#f5ecd5';
            ctx.fillRect(coord.x, coord.y, coord.w, coord.h);

            // Subtle paper aging vignette
            const grad = ctx.createLinearGradient(coord.x, coord.y, coord.x + coord.w, coord.y + coord.h);
            grad.addColorStop(0, 'rgba(235, 215, 175, 0.4)');
            grad.addColorStop(1, 'rgba(215, 190, 145, 0.6)');
            ctx.fillStyle = grad;
            ctx.fillRect(coord.x, coord.y, coord.w, coord.h);

            // Corner Tiles vs Regular Tiles
            if (coord.orientation === 'corner') {
                this.drawCornerTile(ctx, tile, coord);
            } else {
                this.drawStandardTile(ctx, tile, coord, gameState);
            }

            // Mortgaged overlay
            if (gameState && gameState.properties[tile.id] && gameState.properties[tile.id].mortgaged) {
                this.drawMortgageStamp(ctx, coord);
            }

            ctx.restore();
        }
    }

    /**
     * Draw a standard property / utility / card tile
     */
    drawStandardTile(ctx, tile, coord, gameState) {
        const { x, y, w, h, orientation } = coord;
        const isProperty = tile.type === 'property';
        const color = isProperty ? COLOR_GROUPS[tile.group]?.color : null;

        ctx.save();
        ctx.translate(coord.centerX, coord.centerY);

        // Rotate content so text is right-side up relative to board edge
        if (orientation === 'bottom') {
            // standard orientation
        } else if (orientation === 'left') {
            ctx.rotate(Math.PI / 2);
        } else if (orientation === 'top') {
            ctx.rotate(Math.PI);
        } else if (orientation === 'right') {
            ctx.rotate(-Math.PI / 2);
        }

        const localW = (orientation === 'left' || orientation === 'right') ? h : w;
        const localH = (orientation === 'left' || orientation === 'right') ? w : h;
        const halfW = localW / 2;
        const halfH = localH / 2;

        // Color Bar on top (for properties)
        if (isProperty && color) {
            const barHeight = 22;
            ctx.fillStyle = color;
            ctx.fillRect(-halfW, -halfH, localW, barHeight);

            // Fine wood/cloth stitch pattern
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(-halfW, -halfH + barHeight - 2, localW, 2);
        }

        // Ownership Badge
        const propState = gameState ? gameState.properties[tile.id] : null;
        if (propState && propState.owner !== null) {
            const owner = gameState.players.find(p => p.id === propState.owner);
            if (owner) {
                ctx.fillStyle = owner.color || '#333';
                ctx.beginPath();
                ctx.arc(-halfW + 10, -halfH + 11, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }

        // Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#2c1e14';
        ctx.font = 'bold 9.5px "Trebuchet MS", sans-serif';

        const titleY = isProperty ? -halfH + 34 : -halfH + 16;
        // Split name into 2 lines if needed
        const words = tile.name.split(' ');
        if (words.length > 1 && tile.name.length > 9) {
            ctx.fillText(words.slice(0, Math.ceil(words.length / 2)).join(' '), 0, titleY);
            ctx.fillText(words.slice(Math.ceil(words.length / 2)).join(' '), 0, titleY + 11);
        } else {
            ctx.fillText(tile.name, 0, titleY);
        }

        // Center Tile Icon
        this.drawTileIcon(ctx, tile.icon, 0, 8, 24);

        // Price Tag at Bottom
        if (tile.cost) {
            ctx.font = 'bold 10px "Trebuchet MS", sans-serif';
            ctx.fillStyle = '#1e6833';
            ctx.fillText(`${tile.cost} 🟩`, 0, halfH - 8);
        } else if (tile.type === 'chest') {
            ctx.font = 'italic 8.5px "Georgia", serif';
            ctx.fillStyle = '#6a4729';
            ctx.fillText("Chest", 0, halfH - 8);
        } else if (tile.type === 'chance') {
            ctx.font = 'italic 8.5px "Georgia", serif';
            ctx.fillStyle = '#a66a1a';
            ctx.fillText("Lucky", 0, halfH - 8);
        }

        ctx.restore();
    }

    /**
     * Draw the 4 special corner tiles
     */
    drawCornerTile(ctx, tile, coord) {
        const { x, y, w, h } = coord;
        const cx = coord.centerX;
        const cy = coord.centerY;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (tile.id === 0) {
            // GO / Spawn Point
            ctx.fillStyle = '#3a8738';
            ctx.fillRect(x + 5, y + 5, w - 10, 24);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
            ctx.fillText("SPAWN POINT", cx, y + 17);

            this.drawTileIcon(ctx, 'compass', cx, cy + 8, 38);

            ctx.font = 'bold 10.5px "Trebuchet MS", sans-serif';
            ctx.fillStyle = '#1a5929';
            ctx.fillText("COLLECT 200 🟩", cx, y + h - 18);
        } else if (tile.id === 10) {
            // Bedrock Prison / Jail
            ctx.fillStyle = '#2b2927';
            ctx.fillRect(x + 5, y + 5, w * 0.65, h * 0.65);

            // Iron Bars
            ctx.strokeStyle = '#aaaaaa';
            ctx.lineWidth = 3;
            for (let bx = x + 15; bx < x + w * 0.65; bx += 14) {
                ctx.beginPath();
                ctx.moveTo(bx, y + 6);
                ctx.lineTo(bx, y + h * 0.65);
                ctx.stroke();
            }

            ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
            ctx.fillStyle = '#ff5555';
            ctx.fillText("IN PRISON", x + w * 0.32, y + h * 0.32);

            ctx.font = 'bold 9.5px "Trebuchet MS", sans-serif';
            ctx.fillStyle = '#5c4838';
            ctx.fillText("JUST VISITING", cx, y + h - 14);
        } else if (tile.id === 20) {
            // Village Haven / Free Parking
            ctx.fillStyle = '#29608a';
            ctx.fillRect(x + 5, y + 5, w - 10, 22);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
            ctx.fillText("SAFE HAVEN", cx, y + 16);

            this.drawTileIcon(ctx, 'bell', cx, cy + 8, 36);

            ctx.font = 'italic 9.5px "Georgia", serif';
            ctx.fillStyle = '#3c2b1d';
            ctx.fillText("Village Shelter", cx, y + h - 15);
        } else if (tile.id === 30) {
            // Warden Ambush / Go to Jail
            ctx.fillStyle = '#06292b';
            ctx.fillRect(x + 5, y + 5, w - 10, 22);
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
            ctx.fillText("WARDEN AMBUSH", cx, y + 16);

            this.drawTileIcon(ctx, 'warden', cx, cy + 8, 40);

            ctx.font = 'bold 10px "Trebuchet MS", sans-serif';
            ctx.fillStyle = '#ba1e1e';
            ctx.fillText("GO TO PRISON!", cx, y + h - 15);
        }

        ctx.restore();
    }

    /**
     * Draw iconic Minecraft pixel-styled icons
     */
    drawTileIcon(ctx, iconType, cx, cy, size) {
        const half = size / 2;
        ctx.save();

        switch (iconType) {
            case 'chest':
                // Handcrafted Wooden Treasure Chest
                ctx.fillStyle = '#8b5a2b';
                ctx.fillRect(cx - half, cy - half * 0.7, size, size * 0.7);
                ctx.fillStyle = '#2b1d0c';
                ctx.fillRect(cx - half, cy - 2, size, 3); // lid seam
                ctx.fillStyle = '#e6c845';
                ctx.fillRect(cx - 3, cy - 4, 6, 8); // golden latch
                break;

            case 'lucky':
                // Yellow Lucky Block
                ctx.fillStyle = '#e0a519';
                ctx.fillRect(cx - half, cy - half, size, size);
                ctx.strokeStyle = '#8a6008';
                ctx.lineWidth = 2;
                ctx.strokeRect(cx - half, cy - half, size, size);
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${size * 0.75}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText("?", cx, cy + 1);
                break;

            case 'minecart':
                // Iron Minecart with wheels
                ctx.fillStyle = '#7a7a7a';
                ctx.fillRect(cx - half, cy - half * 0.5, size, size * 0.7);
                ctx.fillStyle = '#3a3a3a';
                ctx.fillRect(cx - half + 3, cy - half * 0.5 + 2, size - 6, size * 0.4);
                // Wheels
                ctx.fillStyle = '#222';
                ctx.beginPath();
                ctx.arc(cx - half * 0.5, cy + half * 0.35, 4, 0, Math.PI * 2);
                ctx.arc(cx + half * 0.5, cy + half * 0.35, 4, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'compass':
                // Spawn Compass
                ctx.fillStyle = '#8a7d6b';
                ctx.beginPath();
                ctx.arc(cx, cy, half, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#111';
                ctx.beginPath();
                ctx.arc(cx, cy, half - 3, 0, Math.PI * 2);
                ctx.fill();
                // Red needle
                ctx.fillStyle = '#e02828';
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + 4, cy);
                ctx.lineTo(cx, cy - half + 5);
                ctx.fill();
                break;

            case 'bell':
                // Golden Village Bell
                ctx.fillStyle = '#5c3e21';
                ctx.fillRect(cx - half, cy - half, size, 4); // beam
                ctx.fillStyle = '#d9a826';
                ctx.beginPath();
                ctx.arc(cx, cy + 2, half * 0.75, Math.PI, 0);
                ctx.lineTo(cx + half * 0.75, cy + half * 0.6);
                ctx.lineTo(cx - half * 0.75, cy + half * 0.6);
                ctx.fill();
                break;

            case 'warden':
                // Sculk Warden Face
                ctx.fillStyle = '#06292b';
                ctx.fillRect(cx - half, cy - half, size, size);
                // Horns
                ctx.fillStyle = '#00a8aa';
                ctx.fillRect(cx - half - 3, cy - half, 5, 8);
                ctx.fillRect(cx + half - 2, cy - half, 5, 8);
                // Glowing chest/mouth
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(cx - 5, cy - 2, 10, 6);
                break;

            case 'redstone':
                // Redstone Dust / Torch
                ctx.fillStyle = '#5c3a1e';
                ctx.fillRect(cx - 2, cy - 2, 4, half + 2); // stick
                ctx.fillStyle = '#e01b1b';
                ctx.fillRect(cx - 4, cy - half + 2, 8, 8); // red head
                ctx.fillStyle = '#ff7777';
                ctx.fillRect(cx - 2, cy - half + 4, 4, 4);
                break;

            case 'anvil':
                // Iron Anvil
                ctx.fillStyle = '#42413e';
                ctx.fillRect(cx - half, cy - half + 2, size, 6);
                ctx.fillRect(cx - 4, cy - half + 8, 8, 8);
                ctx.fillRect(cx - half * 0.7, cy + half - 6, size * 0.7, 6);
                break;

            default:
                // Biome pixel block
                this.drawGenericBiomeBlock(ctx, iconType, cx, cy, size);
                break;
        }

        ctx.restore();
    }

    /**
     * Draw decorative biome miniature blocks
     */
    drawGenericBiomeBlock(ctx, icon, cx, cy, size) {
        const half = size / 2;
        let topColor = '#59a836';
        let botColor = '#6e4a2c';

        if (icon === 'dirt') { topColor = '#80593b'; botColor = '#573a23'; }
        else if (icon === 'oak') { topColor = '#47852c'; botColor = '#59381e'; }
        else if (icon === 'birch') { topColor = '#609c3c'; botColor = '#c4baaa'; }
        else if (icon === 'spruce') { topColor = '#2b572e'; botColor = '#3b2513'; }
        else if (icon === 'snow') { topColor = '#e8f2f5'; botColor = '#688c94'; }
        else if (icon === 'cactus') { topColor = '#448c27'; botColor = '#d6b876'; }
        else if (icon === 'terracotta') { topColor = '#b85f37'; botColor = '#8c4220'; }
        else if (icon === 'acacia') { topColor = '#8f833a'; botColor = '#8c4927'; }
        else if (icon === 'lilypad') { topColor = '#376930'; botColor = '#2c362b'; }
        else if (icon === 'mangrove') { topColor = '#4a7536'; botColor = '#733737'; }
        else if (icon === 'dark_oak') { topColor = '#24451b'; botColor = '#2e1c0e'; }
        else if (icon === 'vine' || icon === 'bamboo') { topColor = '#2e9429'; botColor = '#529633'; }
        else if (icon === 'mushroom') { topColor = '#d12e2e'; botColor = '#dedede'; }
        else if (icon === 'coral') { topColor = '#db327e'; botColor = '#28759e'; }
        else if (icon === 'sculk') { topColor = '#00a3a8'; botColor = '#04171a'; }
        else if (icon === 'prismarine') { topColor = '#499e96'; botColor = '#285e59'; }
        else if (icon === 'netherrack') { topColor = '#8a2727'; botColor = '#571818'; }
        else if (icon === 'crimson') { topColor = '#a11f3d'; botColor = '#590e20'; }
        else if (icon === 'basalt') { topColor = '#54545c'; botColor = '#2a2a2e'; }
        else if (icon === 'blaze') { topColor = '#f2a818'; botColor = '#8c1f0b'; }
        else if (icon === 'dragon') { topColor = '#a82ee6'; botColor = '#12051a'; }

        // Block isometric 2.5D or front view
        ctx.fillStyle = botColor;
        ctx.fillRect(cx - half, cy - half + 6, size, size - 6);
        ctx.fillStyle = topColor;
        ctx.fillRect(cx - half, cy - half, size, 7);
    }

    /**
     * Mortgaged stamp across property
     */
    drawMortgageStamp(ctx, coord) {
        ctx.save();
        ctx.translate(coord.centerX, coord.centerY);
        ctx.rotate(-Math.PI / 4);

        // Wooden cross planks
        ctx.fillStyle = 'rgba(74, 42, 19, 0.85)';
        ctx.fillRect(-coord.w * 0.45, -10, coord.w * 0.9, 20);

        ctx.strokeStyle = '#c43333';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-coord.w * 0.45, -10, coord.w * 0.9, 20);

        ctx.fillStyle = '#ffdede';
        ctx.font = 'bold 9px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("MORTGAGED", 0, 0);

        ctx.restore();
    }

    /**
     * Draw thin rustic stick dividers separating the 40 spaces
     */
    drawStickGrid(ctx, size) {
        for (let i = 0; i < 40; i++) {
            const c = this.tileCoords[i];
            if (!c) continue;

            if (c.orientation === 'bottom') {
                this.drawProceduralStick(ctx, c.x, c.y, c.x, c.y + c.h, 6, '#4d321d');
            } else if (c.orientation === 'top') {
                this.drawProceduralStick(ctx, c.x + c.w, c.y, c.x + c.w, c.y + c.h, 6, '#4d321d');
            } else if (c.orientation === 'left') {
                this.drawProceduralStick(ctx, c.x, c.y, c.x + c.w, c.y, 6, '#4d321d');
            } else if (c.orientation === 'right') {
                this.drawProceduralStick(ctx, c.x, c.y + c.h, c.x + c.w, c.y + c.h, 6, '#4d321d');
            }
        }
    }

    /**
     * Draw the heavy outer stick frame logs and tied twine ropes
     */
    drawOuterStickFrame(ctx, size) {
        const lw = this.logWidth;
        const halfLw = lw / 2;

        // 4 Framing Logs: Top, Bottom, Left, Right
        // Top log
        this.drawProceduralStick(ctx, -10, halfLw, size + 10, halfLw, lw, '#5c391e', true);
        // Bottom log
        this.drawProceduralStick(ctx, -10, size - halfLw, size + 10, size - halfLw, lw, '#4e2f18', true);
        // Left log
        this.drawProceduralStick(ctx, halfLw, -10, halfLw, size + 10, lw, '#54341b', true);
        // Right log
        this.drawProceduralStick(ctx, size - halfLw, -10, size - halfLw, size + 10, lw, '#482a15', true);

        // 4 Corner Intersections: Cross-Tied Hemp Twine / Rope
        const offset = halfLw;
        this.drawTwineKnot(ctx, offset, offset, 24);
        this.drawTwineKnot(ctx, size - offset, offset, 24);
        this.drawTwineKnot(ctx, offset, size - offset, 24);
        this.drawTwineKnot(ctx, size - offset, size - offset, 24);
    }

    /**
     * Procedural Stick Generator: Draws organic bark, grain, and knots
     */
    drawProceduralStick(ctx, x1, y1, x2, y2, thickness, baseColor = '#5c3a21', isHeavy = false) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(x1, y1);
        ctx.rotate(angle);

        // Cast shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = isHeavy ? 8 : 4;
        ctx.shadowOffsetY = isHeavy ? 4 : 2;

        // Stick trunk (capsule)
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        const halfThick = thickness / 2;
        ctx.roundRect(0, -halfThick, len, thickness, halfThick);
        ctx.fill();

        ctx.restore();

        // Second pass: Grain ridges & bark highlights without shadow
        ctx.save();
        ctx.translate(x1, y1);
        ctx.rotate(angle);

        // Top highlight (sun reflection on wood)
        ctx.fillStyle = 'rgba(255, 230, 180, 0.16)';
        ctx.fillRect(0, -halfThick + 1, len, Math.max(1, thickness * 0.25));

        // Bottom bark shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(0, halfThick - Math.max(2, thickness * 0.3), len, Math.max(2, thickness * 0.3));

        // Organic wood grain streaks
        ctx.fillStyle = 'rgba(20, 10, 5, 0.12)';
        const streaks = isHeavy ? 6 : 2;
        for (let i = 0; i < streaks; i++) {
            const streakY = -halfThick + (thickness / (streaks + 1)) * (i + 1);
            ctx.fillRect(10 + i * 25, streakY, len - 20, 1.2);
        }

        ctx.restore();
    }

    /**
     * Draw cross-tied twine / rope knot at stick intersections
     */
    drawTwineKnot(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);

        // Rope color palette
        const ropeColor = '#cfb06b';
        const ropeDark = '#7d6129';

        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 4;

        // Diagonal 1
        ctx.strokeStyle = ropeColor;
        ctx.lineWidth = size * 0.25;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-size * 0.6, -size * 0.6);
        ctx.lineTo(size * 0.6, size * 0.6);
        ctx.stroke();

        // Diagonal 2
        ctx.beginPath();
        ctx.moveTo(size * 0.6, -size * 0.6);
        ctx.lineTo(-size * 0.6, size * 0.6);
        ctx.stroke();

        // Center knot ring
        ctx.fillStyle = ropeDark;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = ropeColor;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Draw Wooden Huts (Houses) and Nether Beacons (Hotels)
     */
    drawPropertyHouses(ctx, gameState) {
        if (!gameState || !gameState.properties) return;

        for (let i = 0; i < 40; i++) {
            const prop = gameState.properties[i];
            if (!prop || !prop.houses || prop.houses <= 0) continue;

            const coord = this.tileCoords[i];
            if (!coord) continue;

            const isHotel = prop.houses === 5;
            const houseCount = isHotel ? 1 : prop.houses;

            ctx.save();
            ctx.translate(coord.centerX, coord.centerY);

            // Determine house banner position on tile
            let anchorX = 0;
            let anchorY = -coord.h / 2 + 10;
            if (coord.orientation === 'top') anchorY = coord.h / 2 - 10;
            if (coord.orientation === 'left') { anchorX = coord.w / 2 - 10; anchorY = 0; }
            if (coord.orientation === 'right') { anchorX = -coord.w / 2 + 10; anchorY = 0; }

            if (isHotel) {
                // Nether Beacon (Hotel)
                this.drawNetherBeacon(ctx, anchorX, anchorY, 16);
            } else {
                // 1 to 4 Wooden Huts
                const spacing = 11;
                const startX = anchorX - ((houseCount - 1) * spacing) / 2;
                for (let h = 0; h < houseCount; h++) {
                    this.drawWoodenHut(ctx, startX + h * spacing, anchorY, 9);
                }
            }

            ctx.restore();
        }
    }

    /**
     * Draw tiny carved wooden shelter / hut
     */
    drawWoodenHut(ctx, x, y, size) {
        ctx.save();
        // Hut walls
        ctx.fillStyle = '#69431e';
        ctx.fillRect(x - size / 2, y - size / 2 + 2, size, size - 2);

        // Hut roof
        ctx.fillStyle = '#9e622b';
        ctx.beginPath();
        ctx.moveTo(x, y - size / 2 - 2);
        ctx.lineTo(x + size / 2 + 2, y - size / 2 + 3);
        ctx.lineTo(x - size / 2 - 2, y - size / 2 + 3);
        ctx.fill();

        // Hut door
        ctx.fillStyle = '#301c0b';
        ctx.fillRect(x - 1.5, y + 1, 3, size / 2 - 1);
        ctx.restore();
    }

    /**
     * Draw glowing Nether Beacon (Hotel equivalent)
     */
    drawNetherBeacon(ctx, x, y, size) {
        ctx.save();
        // Obsidian base
        ctx.fillStyle = '#1e112b';
        ctx.fillRect(x - size / 2, y - size / 2 + 3, size, size - 3);

        // Glass cage
        ctx.strokeStyle = '#6edbda';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - size / 2, y - size / 2 + 3, size, size - 3);

        // Nether star glowing core
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y + 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Skyward light beam
        ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.fillRect(x - 2, y - 25, 4, 25);
        ctx.restore();
    }

    /**
     * Draw 2.5D Physical Dice
     */
    drawDice(ctx) {
        Physics.dice.forEach(die => {
            ctx.save();
            const { x, y, z, angle, size, faceValue } = die;

            // 1. Dynamic Drop Shadow
            // Shadow size shrinks & blurs when die is high in the air
            const shadowScale = Math.max(0.4, 1.0 - z / 220);
            const shadowOffset = 6 + z * 0.25;

            ctx.save();
            ctx.translate(x, y + shadowOffset);
            ctx.rotate(angle);
            ctx.fillStyle = `rgba(30, 18, 10, ${0.45 * shadowScale})`;
            ctx.beginPath();
            ctx.roundRect(-size / 2 * shadowScale, -size / 2 * shadowScale, size * shadowScale, size * shadowScale, 6);
            ctx.fill();
            ctx.restore();

            // 2. Physical Die Body (elevated by z)
            ctx.translate(x, y - z);
            ctx.rotate(angle);

            // Wooden Die Cube Face
            const half = size / 2;
            ctx.fillStyle = '#edd8b1'; // pale carved oak
            ctx.beginPath();
            ctx.roundRect(-half, -half, size, size, 6);
            ctx.fill();

            // Bevel edge highlights
            ctx.strokeStyle = '#c4a674';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Pips (Dark Carved Minecraft Dots)
            ctx.fillStyle = '#3a2414';
            this.drawDicePips(ctx, faceValue, half);

            ctx.restore();
        });
    }

    /**
     * Draw classic pip patterns on die face
     */
    drawDicePips(ctx, val, half) {
        const offset = half * 0.52;
        const r = 3.6;

        const drawDot = (px, py) => {
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
        };

        if (val === 1) {
            drawDot(0, 0);
        } else if (val === 2) {
            drawDot(-offset, -offset);
            drawDot(offset, offset);
        } else if (val === 3) {
            drawDot(-offset, -offset);
            drawDot(0, 0);
            drawDot(offset, offset);
        } else if (val === 4) {
            drawDot(-offset, -offset);
            drawDot(offset, -offset);
            drawDot(-offset, offset);
            drawDot(offset, offset);
        } else if (val === 5) {
            drawDot(-offset, -offset);
            drawDot(offset, -offset);
            drawDot(0, 0);
            drawDot(-offset, offset);
            drawDot(offset, offset);
        } else if (val === 6) {
            drawDot(-offset, -offset);
            drawDot(offset, -offset);
            drawDot(-offset, 0);
            drawDot(offset, 0);
            drawDot(-offset, offset);
            drawDot(offset, offset);
        }
    }

    /**
     * Draw Player Tokens with dynamic shadows and Minecraft figurines
     */
    drawTokens(ctx, gameState) {
        if (!gameState || !gameState.players) return;

        // Group players by tile to compute separation
        const tileGroups = new Map();
        gameState.players.forEach(p => {
            if (!tileGroups.has(p.position)) tileGroups.set(p.position, []);
            tileGroups.get(p.position).push(p);
        });

        // Update target positions in physics
        tileGroups.forEach((playersOnTile, tileIdx) => {
            playersOnTile.forEach((player, idx) => {
                const targetPos = this.getTokenPositionOnTile(tileIdx, idx, playersOnTile.length);
                const pToken = Physics.tokens.get(player.id);
                if (pToken && !pToken.isHopping && !pToken.isDragging) {
                    pToken.targetX = targetPos.x;
                    pToken.targetY = targetPos.y;
                }
            });
        });

        // Draw each token
        gameState.players.forEach(player => {
            const pToken = Physics.tokens.get(player.id);
            if (!pToken) return;

            const x = pToken.x || 460;
            const y = pToken.y || 460;
            const z = pToken.z || 0;
            const tilt = pToken.tilt || 0;
            const scaleX = pToken.scaleX || 1.0;
            const scaleY = pToken.scaleY || 1.0;

            const tokenDef = TOKENS.find(t => t.id === player.token) || TOKENS[0];

            ctx.save();

            // 1. Dynamic Drop Shadow on board
            const shadowScale = Math.max(0.5, 1.0 - z / 120);
            const shadowAlpha = 0.45 * shadowScale;
            ctx.save();
            ctx.translate(x, y + 12 + z * 0.2);
            ctx.scale(scaleX * shadowScale, scaleY * 0.45 * shadowScale);
            ctx.fillStyle = `rgba(20, 10, 5, ${shadowAlpha})`;
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 2. Physical Figurine (elevated by z)
            ctx.translate(x, y - z);
            ctx.rotate(tilt);
            ctx.scale(scaleX, scaleY);

            // Active player glow ring
            if (gameState.currentPlayerIndex !== undefined && gameState.players[gameState.currentPlayerIndex]?.id === player.id) {
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, 24, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Draw handcrafted figurine
            this.drawMinecraftFigurine(ctx, tokenDef, player);

            ctx.restore();
        });
    }

    /**
     * Draw Carved Wooden Minecraft Figurine (Steve, Alex, Creeper, etc.)
     */
    drawMinecraftFigurine(ctx, def, player) {
        ctx.save();

        if (def.type === 'creeper_stick') {
            // Twig Creeper
            // Feet
            ctx.fillStyle = '#1d5314';
            ctx.fillRect(-10, 6, 8, 8);
            ctx.fillRect(2, 6, 8, 8);
            // Body
            ctx.fillStyle = '#328325';
            ctx.fillRect(-8, -10, 16, 18);
            // Head
            ctx.fillStyle = '#429c33';
            ctx.fillRect(-12, -28, 24, 20);
            // Face
            ctx.fillStyle = '#111111';
            ctx.fillRect(-8, -24, 5, 5); // eyes
            ctx.fillRect(3, -24, 5, 5);
            ctx.fillRect(-4, -18, 8, 7); // frown
        } else if (def.type === 'enderman_tall') {
            // Charred Enderman
            // Tall legs
            ctx.fillStyle = '#0c0c0c';
            ctx.fillRect(-5, 0, 3, 16);
            ctx.fillRect(2, 0, 3, 16);
            // Torso
            ctx.fillStyle = '#161616';
            ctx.fillRect(-6, -18, 12, 18);
            // Head
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(-8, -34, 16, 16);
            // Glowing Purple Eyes
            ctx.fillStyle = '#d042ff';
            ctx.shadowColor = '#d042ff';
            ctx.shadowBlur = 6;
            ctx.fillRect(-7, -27, 4, 2);
            ctx.fillRect(3, -27, 4, 2);
        } else if (def.type === 'pig_block') {
            // Clay Pig
            // Legs
            ctx.fillStyle = '#db6b6b';
            ctx.fillRect(-10, 4, 6, 6);
            ctx.fillRect(4, 4, 6, 6);
            // Body
            ctx.fillStyle = '#f08585';
            ctx.fillRect(-12, -10, 24, 16);
            // Head
            ctx.fillRect(-8, -24, 16, 14);
            // Snout
            ctx.fillStyle = '#c75656';
            ctx.fillRect(-4, -18, 8, 6);
            // Eyes
            ctx.fillStyle = '#111';
            ctx.fillRect(-7, -22, 2, 2);
            ctx.fillRect(5, -22, 2, 2);
        } else {
            // Classic Carved Steve / Alex Human Figurine
            // Legs
            ctx.fillStyle = def.secondaryColor || '#00158f';
            ctx.fillRect(-7, 4, 6, 12);
            ctx.fillRect(1, 4, 6, 12);

            // Shirt / Torso
            ctx.fillStyle = def.primaryColor || '#00a8a8';
            ctx.fillRect(-9, -12, 18, 16);

            // Wooden Head
            ctx.fillStyle = def.headColor || '#b87b58';
            ctx.fillRect(-10, -28, 20, 16);

            // Hair
            ctx.fillStyle = def.hairColor || '#3c220f';
            ctx.fillRect(-10, -28, 20, 5);

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.fillRect(-7, -21, 4, 3);
            ctx.fillRect(3, -21, 4, 3);
            ctx.fillStyle = '#2255aa';
            ctx.fillRect(-5, -21, 2, 3);
            ctx.fillRect(3, -21, 2, 3);
        }

        // Mini wooden base pedastal
        ctx.fillStyle = '#52341b';
        ctx.beginPath();
        ctx.ellipse(0, 14, 13, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Draw active dust / spark particles
     */
    drawParticles(ctx) {
        Physics.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    /**
     * Tile selection / hover bounding glow
     */
    drawTileHighlight(ctx, tileId, strokeColor) {
        const c = this.tileCoords[tileId];
        if (!c) return;

        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3.5;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 8;
        ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
        ctx.restore();
    }

    /**
     * Convert screen/client coordinate to board coordinate
     */
    screenToBoard(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.boardSize / rect.width;
        const scaleY = this.boardSize / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    /**
     * Find tile under point
     */
    getTileAt(x, y) {
        for (let i = 0; i < 40; i++) {
            const c = this.tileCoords[i];
            if (c && x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
                return i;
            }
        }
        return null;
    }
}
