/**
 * Monopoly Rules Engine & Game State Manager
 * Full Monopoly mechanics: Turns, Doubles, Jail, Color Monopolies, Huts/Beacons,
 * Rent, Utilities, Minecarts, Cards, Mortgages, Trading, and Bankruptcy.
 */

class GameState {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.properties = {};
        this.villagePot = 0; // Emeralds pooled at Free Parking
        this.lastRoll = [1, 2];
        this.doublesCount = 0;
        this.isDoubles = false;
        this.hasRolled = false;
        this.awaitingAction = false;
        this.gameOver = false;
        this.winner = null;

        // Card Decks
        this.luckyDeck = [];
        this.chestDeck = [];

        // Event callbacks for UI
        this.onLog = null;
        this.onTurnChange = null;
        this.onStateChange = null;
        this.onCardDrawn = null;
        this.onTileAction = null;
        this.onGameOver = null;
    }

    /**
     * Start a new game with player setups
     */
    initGame(playerConfigs) {
        this.players = playerConfigs.map((cfg, idx) => ({
            id: idx,
            name: cfg.name,
            isAI: cfg.isAI || false,
            aiPersona: cfg.aiPersona || 'balanced',
            token: cfg.token || TOKENS[idx % TOKENS.length].id,
            color: cfg.color || '#00a8a8',
            emeralds: CONFIG.STARTING_EMERALDS,
            position: 0,
            inJail: false,
            jailTurns: 0,
            getOutOfJailCards: 0,
            bankrupt: false
        }));

        // Reset properties
        this.properties = {};
        BOARD_TILES.forEach(tile => {
            if (tile.type === 'property' || tile.type === 'railroad' || tile.type === 'utility') {
                this.properties[tile.id] = {
                    owner: null,
                    houses: 0,
                    mortgaged: false
                };
            }
        });

        this.shuffleDecks();
        this.villagePot = 100; // Starting pot bonus
        this.currentPlayerIndex = 0;
        this.doublesCount = 0;
        this.hasRolled = false;
        this.awaitingAction = false;
        this.gameOver = false;
        this.winner = null;

        // Register tokens into physics engine
        this.players.forEach(p => {
            Physics.registerToken(p);
        });

        this.log(`Game started! ${this.players.length} crafters entered the world.`, 'info');
        this.log(`It is ${this.getCurrentPlayer().name}'s turn.`, 'turn');

        if (this.onStateChange) this.onStateChange();
        if (this.onTurnChange) this.onTurnChange(this.getCurrentPlayer());
    }

    shuffleDecks() {
        this.luckyDeck = [...LUCKY_BLOCK_CARDS].sort(() => Math.random() - 0.5);
        this.chestDeck = [...TREASURE_CHEST_CARDS].sort(() => Math.random() - 0.5);
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    log(message, type = 'normal') {
        if (this.onLog) this.onLog(message, type);
    }

    /**
     * Execute a turn roll
     */
    rollDice(overrideValues = null) {
        if (this.hasRolled || this.awaitingAction || this.gameOver) return;

        const player = this.getCurrentPlayer();
        const d1 = overrideValues ? overrideValues[0] : Math.floor(Math.random() * 6) + 1;
        const d2 = overrideValues ? overrideValues[1] : Math.floor(Math.random() * 6) + 1;
        const total = d1 + d2;
        const isDouble = d1 === d2;

        this.lastRoll = [d1, d2];
        this.isDoubles = isDouble;

        // Trigger physical dice toss in physics engine
        Physics.rollDice(d1, d2, () => {
            this.handleDiceSettled(d1, d2, total, isDouble);
        });
    }

    handleDiceSettled(d1, d2, total, isDouble) {
        const player = this.getCurrentPlayer();
        this.hasRolled = true;

        this.log(`${player.name} rolled [${d1}] + [${d2}] = ${total}${isDouble ? ' (DOUBLES!)' : ''}`, 'roll');

        // Check Jail state
        if (player.inJail) {
            if (isDouble) {
                this.log(`${player.name} rolled doubles and broke free from Bedrock Prison!`, 'success');
                player.inJail = false;
                player.jailTurns = 0;
                this.doublesCount = 0;
                this.movePlayer(player, total);
            } else {
                player.jailTurns++;
                if (player.jailTurns >= 3) {
                    this.log(`${player.name} spent 3 turns in prison and must pay 50 🟩 bail.`, 'warning');
                    this.payEmeralds(player, CONFIG.JAIL_FEE, null, () => {
                        player.inJail = false;
                        player.jailTurns = 0;
                        this.movePlayer(player, total);
                    });
                } else {
                    this.log(`${player.name} failed to roll doubles (Turn ${player.jailTurns}/3 in prison).`, 'warning');
                    this.awaitingAction = false;
                    if (this.onStateChange) this.onStateChange();
                }
            }
            return;
        }

        // Speeding rule: 3 consecutive doubles = Jail
        if (isDouble) {
            this.doublesCount++;
            if (this.doublesCount >= CONFIG.MAX_DOUBLES) {
                this.log(`Speeding! ${player.name} rolled 3 doubles in a row and was sent to Bedrock Prison!`, 'danger');
                this.sendToJail(player);
                return;
            }
        } else {
            this.doublesCount = 0;
        }

        // Normal movement
        this.movePlayer(player, total);
    }

    /**
     * Move player token space-by-space with physics hops
     */
    movePlayer(player, steps, onFinished = null) {
        const startPos = player.position;
        const targetPos = (startPos + steps + 40) % 40;

        // Check if passing Spawn Point (GO)
        if (steps > 0 && targetPos < startPos && targetPos !== 0) {
            this.log(`${player.name} passed Spawn Point and collected 200 🟩 Emeralds!`, 'reward');
            player.emeralds += CONFIG.PASS_GO_REWARD;
            Sound.playEmeraldChime(false);
            Physics.createSparkleParticles(460, 460, 15, '#2af575');
        }

        // Generate hop sequence
        const hopPositions = [];
        for (let i = 1; i <= Math.abs(steps); i++) {
            const stepTile = (startPos + (steps > 0 ? i : -i) + 40) % 40;
            const coord = BoardRendererInstance.tileCoords[stepTile];
            hopPositions.push({
                tileIndex: stepTile,
                x: coord.centerX,
                y: coord.centerY
            });
        }

        // Trigger physics hops
        Physics.hopTokenTo(player.id, targetPos, hopPositions, () => {
            player.position = targetPos;
            if (targetPos === 0) {
                this.log(`${player.name} landed directly on Spawn Point! Collected 200 🟩 Emeralds.`, 'reward');
                player.emeralds += CONFIG.PASS_GO_REWARD;
                Sound.playEmeraldChime(false);
            }

            this.handleLandedTile(player, targetPos);
            if (onFinished) onFinished();
            if (this.onStateChange) this.onStateChange();
        });
    }

    /**
     * Handle actions for the space player landed on
     */
    handleLandedTile(player, tileId) {
        const tile = BOARD_TILES[tileId];
        this.log(`${player.name} landed on ${tile.name}.`, 'tile');

        if (tile.type === 'property' || tile.type === 'railroad' || tile.type === 'utility') {
            const prop = this.properties[tileId];
            if (prop.owner === null) {
                // Unowned property - prompt buy
                this.awaitingAction = true;
                if (this.onTileAction) {
                    this.onTileAction({
                        type: 'unowned_property',
                        tile,
                        player
                    });
                }
            } else if (prop.owner !== player.id && !prop.mortgaged) {
                // Pay Rent to owner
                const owner = this.players.find(p => p.id === prop.owner);
                const rent = this.calculateRent(tileId);
                this.log(`${player.name} pays ${rent} 🟩 rent to ${owner.name}.`, 'danger');
                this.payEmeralds(player, rent, owner, () => {
                    this.awaitingAction = false;
                    if (this.onStateChange) this.onStateChange();
                });
            } else if (prop.mortgaged) {
                this.log(`${tile.name} is mortgaged; no rent is owed.`, 'info');
                this.awaitingAction = false;
            } else {
                this.log(`${player.name} visits their own property.`, 'info');
                this.awaitingAction = false;
            }
        } else if (tile.type === 'tax') {
            // Pay Tax to Village Safe Haven pot
            this.log(`${player.name} pays ${tile.cost} 🟩 for ${tile.name} into the Village Pot.`, 'danger');
            this.villagePot += tile.cost;
            this.payEmeralds(player, tile.cost, null, () => {
                this.awaitingAction = false;
                if (this.onStateChange) this.onStateChange();
            });
        } else if (tile.type === 'free_parking') {
            // Collect Village Safe Haven Pot
            if (this.villagePot > 0) {
                this.log(`${player.name} finds the Village Haven treasure! Collected ${this.villagePot} 🟩 Emeralds!`, 'reward');
                player.emeralds += this.villagePot;
                this.villagePot = 0;
                Sound.playEmeraldChime(false);
                Physics.createSparkleParticles(460, 460, 20, '#55ff88');
            } else {
                this.log(`${player.name} takes a peaceful rest in the Village Safe Haven.`, 'info');
            }
            this.awaitingAction = false;
        } else if (tile.type === 'go_to_jail') {
            // Warden Screech!
            Sound.playCreeperHiss();
            this.log(`Warden emerged! ${player.name} is dragged to Bedrock Prison!`, 'danger');
            this.sendToJail(player);
        } else if (tile.type === 'chance') {
            this.drawCard('lucky', player);
        } else if (tile.type === 'chest') {
            this.drawCard('chest', player);
        } else {
            this.awaitingAction = false;
        }

        if (this.onStateChange) this.onStateChange();
    }

    /**
     * Draw Lucky Block or Treasure Chest Card
     */
    drawCard(deckType, player) {
        Sound.playPaperSlide();
        const deck = deckType === 'lucky' ? this.luckyDeck : this.chestDeck;
        if (deck.length === 0) this.shuffleDecks();

        const card = deck.shift();
        this.log(`${player.name} drew: "${card.title}" - ${card.desc}`, 'card');

        this.awaitingAction = true;
        if (this.onCardDrawn) {
            this.onCardDrawn(card, deckType, () => {
                this.applyCardEffect(card, player);
            });
        } else {
            this.applyCardEffect(card, player);
        }
    }

    /**
     * Apply Card Rules
     */
    applyCardEffect(card, player) {
        switch (card.action) {
            case 'collect':
                player.emeralds += card.amount;
                Sound.playEmeraldChime(false);
                this.awaitingAction = false;
                break;

            case 'pay':
                this.payEmeralds(player, card.amount, null, () => {
                    this.villagePot += card.amount;
                    this.awaitingAction = false;
                });
                break;

            case 'advance_to':
                const diff = (card.target - player.position + 40) % 40;
                this.movePlayer(player, diff);
                break;

            case 'move_relative':
                this.movePlayer(player, card.steps);
                break;

            case 'go_to_jail':
                this.sendToJail(player);
                break;

            case 'get_out_of_jail_card':
                player.getOutOfJailCards++;
                this.log(`${player.name} received an Ender Pearl (Get Out of Prison Free)!`, 'reward');
                this.awaitingAction = false;
                break;

            case 'repairs':
                let totalCost = 0;
                Object.entries(this.properties).forEach(([tileId, prop]) => {
                    if (prop.owner === player.id) {
                        if (prop.houses === 5) totalCost += card.hotelCost;
                        else totalCost += prop.houses * card.houseCost;
                    }
                });
                this.log(`${player.name} owes ${totalCost} 🟩 for base fortifications.`, 'danger');
                this.payEmeralds(player, totalCost, null, () => {
                    this.villagePot += totalCost;
                    this.awaitingAction = false;
                });
                break;

            case 'collect_from_all':
                this.players.forEach(p => {
                    if (p.id !== player.id && !p.bankrupt) {
                        const amt = Math.min(p.emeralds, card.amount);
                        p.emeralds -= amt;
                        player.emeralds += amt;
                    }
                });
                Sound.playEmeraldChime(false);
                this.awaitingAction = false;
                break;

            case 'pay_to_all':
                this.players.forEach(p => {
                    if (p.id !== player.id && !p.bankrupt) {
                        this.payEmeralds(player, card.amount, p);
                    }
                });
                this.awaitingAction = false;
                break;

            default:
                this.awaitingAction = false;
                break;
        }

        if (this.onStateChange) this.onStateChange();
    }

    sendToJail(player) {
        player.position = 10;
        player.inJail = true;
        player.jailTurns = 0;
        this.doublesCount = 0;
        this.hasRolled = true;
        this.awaitingAction = false;

        const jailCoord = BoardRendererInstance.tileCoords[10];
        const pToken = Physics.tokens.get(player.id);
        if (pToken) {
            pToken.x = jailCoord.centerX - 15;
            pToken.y = jailCoord.centerY - 15;
            pToken.targetX = pToken.x;
            pToken.targetY = pToken.y;
            pToken.tileIndex = 10;
        }

        if (this.onStateChange) this.onStateChange();
    }

    payJailFine(player) {
        if (!player.inJail || player.emeralds < CONFIG.JAIL_FEE) return;
        player.emeralds -= CONFIG.JAIL_FEE;
        this.villagePot += CONFIG.JAIL_FEE;
        player.inJail = false;
        player.jailTurns = 0;
        Sound.playEmeraldChime(true);
        this.log(`${player.name} paid 50 🟩 emerald fine and escaped Bedrock Prison!`, 'info');
        if (this.onStateChange) this.onStateChange();
    }

    useGetOutOfJailCard(player) {
        if (!player.inJail || player.getOutOfJailCards <= 0) return;
        player.getOutOfJailCards--;
        player.inJail = false;
        player.jailTurns = 0;
        this.log(`${player.name} used their Ender Pearl to teleport out of Bedrock Prison!`, 'reward');
        if (this.onStateChange) this.onStateChange();
    }

    calculateRent(tileId) {
        const tile = BOARD_TILES[tileId];
        const prop = this.properties[tileId];
        if (!tile || !prop || prop.mortgaged) return 0;

        if (tile.type === 'property') {
            if (prop.houses > 0) {
                return tile.rent[prop.houses];
            }
            // Double rent if owner possesses entire color group with 0 houses
            const group = COLOR_GROUPS[tile.group];
            const ownsAll = group.tiles.every(tId => this.properties[tId]?.owner === prop.owner);
            return ownsAll ? tile.rent[0] * 2 : tile.rent[0];
        } else if (tile.type === 'railroad') {
            const count = [5, 15, 25, 35].filter(tId => this.properties[tId]?.owner === prop.owner).length;
            return tile.rent[Math.max(0, count - 1)] || 25;
        } else if (tile.type === 'utility') {
            const count = [12, 28].filter(tId => this.properties[tId]?.owner === prop.owner).length;
            const diceTotal = this.lastRoll[0] + this.lastRoll[1];
            const multiplier = count >= 2 ? 10 : 4;
            return diceTotal * multiplier;
        }
        return 0;
    }

    buyProperty(player, tileId) {
        const tile = BOARD_TILES[tileId];
        const prop = this.properties[tileId];
        if (!tile || !prop || prop.owner !== null || player.emeralds < tile.cost) return false;

        player.emeralds -= tile.cost;
        prop.owner = player.id;
        Sound.playEmeraldChime(false);
        this.log(`${player.name} purchased ${tile.name} for ${tile.cost} 🟩!`, 'reward');

        this.awaitingAction = false;
        if (this.onStateChange) this.onStateChange();
        return true;
    }

    buildHouse(player, tileId) {
        const tile = BOARD_TILES[tileId];
        const prop = this.properties[tileId];
        if (!tile || !prop || prop.owner !== player.id || prop.mortgaged) return false;
        if (prop.houses >= 5 || player.emeralds < tile.houseCost) return false;

        // Verify monopoly
        const group = COLOR_GROUPS[tile.group];
        if (!group.tiles.every(tId => this.properties[tId]?.owner === player.id)) {
            this.log("You must own all properties in this biome set to build shelters!", 'warning');
            return false;
        }

        // Even building rule
        const minHouses = Math.min(...group.tiles.map(tId => this.properties[tId].houses));
        if (prop.houses > minHouses) {
            this.log("Build evenly across all properties in this biome set.", 'warning');
            return false;
        }

        player.emeralds -= tile.houseCost;
        prop.houses++;
        Sound.playBuildHammer();

        const buildingType = prop.houses === 5 ? "Beacon Tower" : "Wooden Hut";
        this.log(`${player.name} built a ${buildingType} on ${tile.name} for ${tile.houseCost} 🟩!`, 'reward');

        if (this.onStateChange) this.onStateChange();
        return true;
    }

    mortgageProperty(player, tileId) {
        const tile = BOARD_TILES[tileId];
        const prop = this.properties[tileId];
        if (!tile || !prop || prop.owner !== player.id || prop.mortgaged || prop.houses > 0) return false;

        prop.mortgaged = true;
        player.emeralds += tile.mortgage;
        Sound.playEmeraldChime(false);
        this.log(`${player.name} mortgaged ${tile.name} for +${tile.mortgage} 🟩!`, 'info');

        if (this.onStateChange) this.onStateChange();
        return true;
    }

    unmortgageProperty(player, tileId) {
        const tile = BOARD_TILES[tileId];
        const prop = this.properties[tileId];
        if (!tile || !prop || prop.owner !== player.id || !prop.mortgaged) return false;

        const cost = Math.round(tile.mortgage * 1.1);
        if (player.emeralds < cost) return false;

        player.emeralds -= cost;
        prop.mortgaged = false;
        Sound.playEmeraldChime(true);
        this.log(`${player.name} unmortgaged ${tile.name} for ${cost} 🟩.`, 'info');

        if (this.onStateChange) this.onStateChange();
        return true;
    }

    payEmeralds(player, amount, recipient = null, onComplete = null) {
        if (player.emeralds >= amount) {
            player.emeralds -= amount;
            if (recipient) recipient.emeralds += amount;
            Sound.playEmeraldChime(true);
            if (onComplete) onComplete();
            return;
        }

        // Insufficient funds - bankruptcy condition
        this.handleBankruptcy(player, amount, recipient);
        if (onComplete) onComplete();
    }

    handleBankruptcy(player, amountNeeded, creditor = null) {
        player.bankrupt = true;
        this.log(`💀 ${player.name} went bankrupt! They could not pay ${amountNeeded} 🟩.`, 'danger');

        // Transfer or liquidate properties
        Object.entries(this.properties).forEach(([tileId, prop]) => {
            if (prop.owner === player.id) {
                if (creditor) {
                    prop.owner = creditor.id;
                    this.log(`${creditor.name} acquired ${BOARD_TILES[tileId].name} from bankruptcy.`, 'info');
                } else {
                    prop.owner = null;
                    prop.houses = 0;
                    prop.mortgaged = false;
                }
            }
        });

        // Hide token in physics
        Physics.tokens.delete(player.id);

        // Check if only 1 active player remains
        const activePlayers = this.players.filter(p => !p.bankrupt);
        if (activePlayers.length === 1) {
            this.gameOver = true;
            this.winner = activePlayers[0];
            this.log(`🏆 VICTORY! ${this.winner.name} is the Master Crafter and wins the game!`, 'victory');
            if (this.onGameOver) this.onGameOver(this.winner);
        }

        if (this.onStateChange) this.onStateChange();
    }

    /**
     * End Current Turn & advance to next active player
     */
    endTurn() {
        if (!this.hasRolled && !this.getCurrentPlayer().bankrupt) {
            this.log("You must roll the dice before ending your turn!", 'warning');
            return;
        }
        if (this.awaitingAction) {
            this.log("Please resolve the current action first.", 'warning');
            return;
        }

        // If rolled doubles and not in jail, player rolls again!
        if (this.isDoubles && !this.getCurrentPlayer().inJail && !this.getCurrentPlayer().bankrupt) {
            this.hasRolled = false;
            this.log(`${this.getCurrentPlayer().name} rolled doubles! Roll again!`, 'info');
            if (this.onStateChange) this.onStateChange();
            if (this.onTurnChange) this.onTurnChange(this.getCurrentPlayer());
            return;
        }

        // Move to next player
        this.doublesCount = 0;
        this.hasRolled = false;
        this.isDoubles = false;

        let nextIdx = (this.currentPlayerIndex + 1) % this.players.length;
        while (this.players[nextIdx].bankrupt) {
            nextIdx = (nextIdx + 1) % this.players.length;
        }

        this.currentPlayerIndex = nextIdx;
        const nextPlayer = this.getCurrentPlayer();
        this.log(`Turn ended. Now it's ${nextPlayer.name}'s turn.`, 'turn');

        if (this.onStateChange) this.onStateChange();
        if (this.onTurnChange) this.onTurnChange(nextPlayer);
    }
}
