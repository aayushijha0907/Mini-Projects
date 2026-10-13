/**
 * AI Opponent Logic & Bot Decision Engine
 * Implements intelligent automated players with distinct Minecraft personalities.
 */

class AIBotController {
    constructor(gameState) {
        this.gameState = gameState;
        this.thinkingDelay = 750; // ms for natural thinking pauses
    }

    /**
     * Called whenever it's an AI's turn or state changes
     */
    processTurn(player) {
        if (!player.isAI || player.bankrupt || this.gameState.gameOver) return;

        setTimeout(() => {
            if (this.gameState.getCurrentPlayer().id !== player.id) return;

            // 1. Jail Decision
            if (player.inJail) {
                this.handleJailDecision(player);
                return;
            }

            // 2. Roll Dice if not yet rolled
            if (!this.gameState.hasRolled && !this.gameState.awaitingAction) {
                this.gameState.rollDice();
                return;
            }

            // 3. Handle awaiting tile actions (buying properties)
            if (this.gameState.awaitingAction) {
                this.handleAwaitingAction(player);
                return;
            }

            // 4. Post-roll decisions: Building huts / upgrading
            if (this.gameState.hasRolled && !this.gameState.awaitingAction) {
                this.handlePostRollDecisions(player);
            }
        }, this.thinkingDelay);
    }

    /**
     * AI Jail Logic
     */
    handleJailDecision(player) {
        // If has card, always use it
        if (player.getOutOfJailCards > 0) {
            this.gameState.useGetOutOfJailCard(player);
            setTimeout(() => this.gameState.rollDice(), 500);
            return;
        }

        // If rich (> 400 emeralds), pay 50 emeralds to get out immediately
        if (player.emeralds > 400 || (player.aiPersona === 'aggressive' && player.emeralds > 150)) {
            this.gameState.payJailFine(player);
            setTimeout(() => this.gameState.rollDice(), 500);
            return;
        }

        // Otherwise try rolling for doubles
        this.gameState.rollDice();
    }

    /**
     * Handle unowned property purchase
     */
    handleAwaitingAction(player) {
        const tileId = player.position;
        const tile = BOARD_TILES[tileId];

        if (tile && (tile.type === 'property' || tile.type === 'railroad' || tile.type === 'utility')) {
            const prop = this.gameState.properties[tileId];
            if (prop && prop.owner === null) {
                // Reserve threshold: keep at least some emeralds for rent
                const reserve = player.aiPersona === 'cautious' ? 200 : (player.aiPersona === 'chaos' ? 20 : 80);
                const canAfford = player.emeralds >= (tile.cost + reserve);

                if (canAfford) {
                    this.gameState.buyProperty(player, tileId);
                } else {
                    this.gameState.log(`${player.name} decided not to buy ${tile.name} to save emeralds.`, 'info');
                    this.gameState.awaitingAction = false;
                }
            }
        }

        setTimeout(() => {
            if (this.gameState.getCurrentPlayer().id === player.id) {
                this.handlePostRollDecisions(player);
            }
        }, 500);
    }

    /**
     * Post-roll upgrade & end turn
     */
    handlePostRollDecisions(player) {
        // Check if player can build huts on any completed biome set
        let builtSomething = false;

        Object.values(COLOR_GROUPS).forEach(group => {
            if (group.name === "Minecart Network" || group.name === "Redstone & Magic") return;

            const ownsGroup = group.tiles.every(tId => this.gameState.properties[tId]?.owner === player.id);
            if (ownsGroup) {
                // Try building on the tile with fewest houses
                const sorted = [...group.tiles].sort((a, b) => {
                    return this.gameState.properties[a].houses - this.gameState.properties[b].houses;
                });

                const targetTileId = sorted[0];
                const tile = BOARD_TILES[targetTileId];
                const prop = this.gameState.properties[targetTileId];

                const reserve = 150;
                if (prop.houses < 5 && player.emeralds >= (tile.houseCost + reserve)) {
                    this.gameState.buildHouse(player, targetTileId);
                    builtSomething = true;
                }
            }
        });

        // End turn after small delay
        setTimeout(() => {
            if (this.gameState.getCurrentPlayer().id === player.id && !this.gameState.awaitingAction) {
                this.gameState.endTurn();
            }
        }, builtSomething ? 600 : 400);
    }
}
