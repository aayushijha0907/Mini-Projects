/**
 * UI Controller & Modal System
 * Manages player status panels, deed popups, card animations, game log,
 * trade negotiation, and game setup screens.
 */

class UIController {
    constructor(gameState, soundSynth) {
        this.gameState = gameState;
        this.sound = soundSynth;
        this.aiBot = new AIBotController(gameState);

        this.bindDOMElements();
        this.attachEventListeners();
        this.setupStateCallbacks();
    }

    bindDOMElements() {
        this.playersListEl = document.getElementById('players-list');
        this.btnRollEl = document.getElementById('btn-roll');
        this.btnEndTurnEl = document.getElementById('btn-end-turn');
        this.btnTradeEl = document.getElementById('btn-trade');
        this.btnMuteEl = document.getElementById('btn-mute');
        this.btnSpeedEl = document.getElementById('btn-speed');
        this.btnNewGameEl = document.getElementById('btn-new-game');
        this.gameLogEl = document.getElementById('game-log-content');
        this.turnBannerEl = document.getElementById('current-turn-banner');

        // Modals
        this.setupModalEl = document.getElementById('setup-modal');
        this.deedModalEl = document.getElementById('deed-modal');
        this.actionModalEl = document.getElementById('action-modal');
        this.cardModalEl = document.getElementById('card-modal');
        this.tradeModalEl = document.getElementById('trade-modal');
        this.victoryModalEl = document.getElementById('victory-modal');

        this.fastSpeed = false;
    }

    attachEventListeners() {
        // Roll Dice button
        this.btnRollEl.addEventListener('click', () => {
            const player = this.gameState.getCurrentPlayer();
            if (player.isAI) return;
            this.gameState.rollDice();
        });

        // End Turn button
        this.btnEndTurnEl.addEventListener('click', () => {
            const player = this.gameState.getCurrentPlayer();
            if (player.isAI) return;
            this.gameState.endTurn();
        });

        // Trade button
        this.btnTradeEl.addEventListener('click', () => {
            this.openTradeModal();
        });

        // Sound toggle
        this.btnMuteEl.addEventListener('click', () => {
            const muted = this.sound.toggleMute();
            this.btnMuteEl.textContent = muted ? '🔇 Muted' : '🔊 Sound On';
            this.btnMuteEl.classList.toggle('active', muted);
        });

        // Speed toggle
        this.btnSpeedEl.addEventListener('click', () => {
            this.fastSpeed = !this.fastSpeed;
            this.btnSpeedEl.textContent = this.fastSpeed ? '⚡ 2x Speed' : '⏱️ 1x Speed';
            this.btnSpeedEl.classList.toggle('active', this.fastSpeed);
            this.aiBot.thinkingDelay = this.fastSpeed ? 350 : 750;
        });

        // New Game button
        this.btnNewGameEl.addEventListener('click', () => {
            this.showSetupModal();
        });

        // Setup form submission
        document.getElementById('setup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSetupSubmit();
        });
    }

    setupStateCallbacks() {
        this.gameState.onLog = (msg, type) => this.addLogMessage(msg, type);

        this.gameState.onTurnChange = (player) => {
            this.updateTurnBanner(player);
            this.updateActionButtons();
            this.renderPlayersHUD();
            this.aiBot.processTurn(player);
        };

        this.gameState.onStateChange = () => {
            this.renderPlayersHUD();
            this.updateActionButtons();
            const player = this.gameState.getCurrentPlayer();
            if (player.isAI) {
                this.aiBot.processTurn(player);
            }
        };

        this.gameState.onCardDrawn = (card, deckType, onDismiss) => {
            this.showCardModal(card, deckType, onDismiss);
        };

        this.gameState.onTileAction = (action) => {
            if (action.type === 'unowned_property') {
                if (action.player.isAI) {
                    this.aiBot.processTurn(action.player);
                } else {
                    this.showUnownedPropertyModal(action.tile, action.player);
                }
            }
        };

        this.gameState.onGameOver = (winner) => {
            this.showVictoryModal(winner);
        };
    }

    updateTurnBanner(player) {
        if (!this.turnBannerEl) return;
        const aiBadge = player.isAI ? '<span class="badge ai">BOT</span>' : '<span class="badge human">YOU</span>';
        const jailBadge = player.inJail ? '<span class="badge jail">IN BEDROCK PRISON</span>' : '';
        this.turnBannerEl.innerHTML = `
            <div class="turn-indicator" style="border-left: 6px solid ${player.color}">
                <div class="turn-name">${player.name} ${aiBadge} ${jailBadge}</div>
                <div class="turn-balance">${player.emeralds} 🟩 Emeralds</div>
            </div>
        `;
    }

    updateActionButtons() {
        const player = this.gameState.getCurrentPlayer();
        const isHuman = !player.isAI && !this.gameState.gameOver;

        // Roll button: enabled if human, hasn't rolled, not awaiting action
        this.btnRollEl.disabled = !isHuman || this.gameState.hasRolled || this.gameState.awaitingAction;

        // End turn button: enabled if human, has rolled, not awaiting action
        this.btnEndTurnEl.disabled = !isHuman || !this.gameState.hasRolled || this.gameState.awaitingAction;

        // Trade button: enabled if human
        this.btnTradeEl.disabled = !isHuman || this.gameState.gameOver;
    }

    renderPlayersHUD() {
        if (!this.playersListEl) return;
        this.playersListEl.innerHTML = '';

        this.gameState.players.forEach(p => {
            const isCurrent = (this.gameState.getCurrentPlayer().id === p.id);
            const tokenDef = TOKENS.find(t => t.id === p.token) || TOKENS[0];

            // Count owned properties
            const owned = Object.entries(this.gameState.properties)
                .filter(([_, prop]) => prop.owner === p.id)
                .map(([id]) => BOARD_TILES[id]);

            const item = document.createElement('div');
            item.className = `player-card ${isCurrent ? 'active' : ''} ${p.bankrupt ? 'bankrupt' : ''}`;
            item.style.borderColor = isCurrent ? '#ffd700' : p.color;

            // Swatches of owned properties
            let swatchesHtml = '';
            owned.forEach(tile => {
                const color = tile.group ? COLOR_GROUPS[tile.group]?.color : '#888';
                swatchesHtml += `<span class="property-swatch" style="background:${color}" title="${tile.name}"></span>`;
            });

            item.innerHTML = `
                <div class="player-card-header">
                    <span class="player-dot" style="background:${p.color}"></span>
                    <strong class="player-title">${p.name}</strong>
                    <span class="player-role">${p.isAI ? 'BOT' : 'PLAYER'}</span>
                </div>
                <div class="player-stats">
                    <span class="emeralds">${p.bankrupt ? '💀 ELIMINATED' : `${p.emeralds} 🟩`}</span>
                    <span class="position">${p.bankrupt ? '' : BOARD_TILES[p.position].name}</span>
                </div>
                <div class="player-properties">${swatchesHtml}</div>
            `;
            this.playersListEl.appendChild(item);
        });
    }

    addLogMessage(msg, type = 'normal') {
        if (!this.gameLogEl) return;
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        entry.innerHTML = `<span class="log-time">[${time}]</span> ${msg}`;

        this.gameLogEl.appendChild(entry);
        this.gameLogEl.scrollTop = this.gameLogEl.scrollHeight;
    }

    /**
     * Show detailed Deed modal on clicking a tile
     */
    showDeedModal(tileId) {
        const tile = BOARD_TILES[tileId];
        const prop = this.gameState.properties[tileId];
        if (!tile) return;

        const isOwner = prop && prop.owner === this.gameState.getCurrentPlayer().id;
        const color = tile.group ? COLOR_GROUPS[tile.group]?.color : '#444';

        let rentTableHtml = '';
        if (tile.type === 'property') {
            rentTableHtml = `
                <div class="deed-rents">
                    <div><span>Site Rent:</span> <span>${tile.rent[0]} 🟩</span></div>
                    <div><span>1 Wooden Hut:</span> <span>${tile.rent[1]} 🟩</span></div>
                    <div><span>2 Wooden Huts:</span> <span>${tile.rent[2]} 🟩</span></div>
                    <div><span>3 Wooden Huts:</span> <span>${tile.rent[3]} 🟩</span></div>
                    <div><span>4 Wooden Huts:</span> <span>${tile.rent[4]} 🟩</span></div>
                    <div><span>Beacon Tower:</span> <span>${tile.rent[5]} 🟩</span></div>
                </div>
                <div class="deed-costs">
                    <div><span>Hut Construction:</span> <span>${tile.houseCost} 🟩 each</span></div>
                    <div><span>Mortgage Value:</span> <span>${tile.mortgage} 🟩</span></div>
                </div>
            `;
        } else if (tile.type === 'railroad') {
            rentTableHtml = `
                <div class="deed-rents">
                    <div><span>1 Minecart Owned:</span> <span>25 🟩</span></div>
                    <div><span>2 Minecarts:</span> <span>50 🟩</span></div>
                    <div><span>3 Minecarts:</span> <span>100 🟩</span></div>
                    <div><span>4 Minecarts:</span> <span>200 🟩</span></div>
                </div>
            `;
        } else if (tile.type === 'utility') {
            rentTableHtml = `
                <div class="deed-rents">
                    <div><span>1 Utility Owned:</span> <span>4x Dice Roll</span></div>
                    <div><span>Both Utilities:</span> <span>10x Dice Roll</span></div>
                </div>
            `;
        } else {
            rentTableHtml = `<p class="deed-desc">${tile.desc || ''}</p>`;
        }

        let ownerName = 'Unowned';
        if (prop && prop.owner !== null) {
            const owner = this.gameState.players.find(p => p.id === prop.owner);
            ownerName = owner ? owner.name : 'Unknown';
        }

        // Action Buttons inside deed modal
        let actionsHtml = '';
        if (isOwner && !this.gameState.getCurrentPlayer().isAI) {
            const canBuild = tile.type === 'property' && prop.houses < 5 && this.gameState.getCurrentPlayer().emeralds >= tile.houseCost;
            if (canBuild) {
                actionsHtml += `<button class="btn craft-btn" id="deed-btn-build">Build Hut (+${tile.houseCost} 🟩)</button>`;
            }
            if (!prop.mortgaged && prop.houses === 0) {
                actionsHtml += `<button class="btn craft-btn" id="deed-btn-mortgage">Mortgage (+${tile.mortgage} 🟩)</button>`;
            } else if (prop.mortgaged) {
                actionsHtml += `<button class="btn craft-btn" id="deed-btn-unmortgage">Unmortgage (-${Math.round(tile.mortgage * 1.1)} 🟩)</button>`;
            }
        }

        this.deedModalEl.innerHTML = `
            <div class="modal-card parchment-paper">
                <div class="deed-header" style="background:${color}">
                    <h3>${tile.name}</h3>
                </div>
                <div class="deed-body">
                    <p class="deed-owner">Owner: <strong>${ownerName}</strong> ${prop && prop.mortgaged ? '<span class="badge danger">MORTGAGED</span>' : ''}</p>
                    ${rentTableHtml}
                    <div class="deed-actions">${actionsHtml}</div>
                </div>
                <button class="btn craft-btn close-btn" id="deed-btn-close">Close</button>
            </div>
        `;

        this.deedModalEl.classList.remove('hidden');

        document.getElementById('deed-btn-close').addEventListener('click', () => {
            this.deedModalEl.classList.add('hidden');
        });

        const btnBuild = document.getElementById('deed-btn-build');
        if (btnBuild) {
            btnBuild.addEventListener('click', () => {
                this.gameState.buildHouse(this.gameState.getCurrentPlayer(), tileId);
                this.showDeedModal(tileId); // refresh
            });
        }

        const btnMortgage = document.getElementById('deed-btn-mortgage');
        if (btnMortgage) {
            btnMortgage.addEventListener('click', () => {
                this.gameState.mortgageProperty(this.gameState.getCurrentPlayer(), tileId);
                this.showDeedModal(tileId);
            });
        }

        const btnUnmortgage = document.getElementById('deed-btn-unmortgage');
        if (btnUnmortgage) {
            btnUnmortgage.addEventListener('click', () => {
                this.gameState.unmortgageProperty(this.gameState.getCurrentPlayer(), tileId);
                this.showDeedModal(tileId);
            });
        }
    }

    /**
     * Show unowned property purchase modal
     */
    showUnownedPropertyModal(tile, player) {
        this.actionModalEl.innerHTML = `
            <div class="modal-card parchment-paper">
                <div class="modal-header">
                    <h2>Claim Wilderness Territory?</h2>
                </div>
                <div class="modal-body">
                    <p>You landed on <strong>${tile.name}</strong>.</p>
                    <p class="modal-cost">Cost: <strong>${tile.cost} 🟩 Emeralds</strong></p>
                    <p>Your Balance: ${player.emeralds} 🟩</p>
                </div>
                <div class="modal-footer">
                    <button class="btn craft-btn success" id="btn-buy-prop" ${player.emeralds < tile.cost ? 'disabled' : ''}>Claim & Buy</button>
                    <button class="btn craft-btn danger" id="btn-pass-prop">Pass</button>
                </div>
            </div>
        `;
        this.actionModalEl.classList.remove('hidden');

        document.getElementById('btn-buy-prop').addEventListener('click', () => {
            this.actionModalEl.classList.add('hidden');
            this.gameState.buyProperty(player, tile.id);
        });

        document.getElementById('btn-pass-prop').addEventListener('click', () => {
            this.actionModalEl.classList.add('hidden');
            this.gameState.log(`${player.name} passed on buying ${tile.name}.`, 'info');
            this.gameState.awaitingAction = false;
            this.updateActionButtons();
        });
    }

    /**
     * Show Lucky Block or Treasure Chest Card Draw
     */
    showCardModal(card, deckType, onDismiss) {
        const isLucky = deckType === 'lucky';
        this.cardModalEl.innerHTML = `
            <div class="modal-card ${isLucky ? 'lucky-card' : 'chest-card'} card-flip-in">
                <div class="card-icon">${isLucky ? '❓' : '🎁'}</div>
                <h2 class="card-title">${card.title}</h2>
                <p class="card-desc">${card.desc}</p>
                <button class="btn craft-btn" id="btn-card-ok">Collect / Continue</button>
            </div>
        `;
        this.cardModalEl.classList.remove('hidden');

        document.getElementById('btn-card-ok').addEventListener('click', () => {
            this.cardModalEl.classList.add('hidden');
            if (onDismiss) onDismiss();
        });
    }

    /**
     * Trade Modal
     */
    openTradeModal() {
        const human = this.gameState.getCurrentPlayer();
        const otherPlayers = this.gameState.players.filter(p => p.id !== human.id && !p.bankrupt);
        if (otherPlayers.length === 0) return;

        let optionsHtml = otherPlayers.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        this.tradeModalEl.innerHTML = `
            <div class="modal-card parchment-paper trade-modal-card">
                <h2>🤝 Villager Barter & Trade</h2>
                <div class="trade-partner-select">
                    <label>Trade Partner:</label>
                    <select id="trade-partner">${optionsHtml}</select>
                </div>
                <div class="trade-columns">
                    <div class="trade-col">
                        <h4>You Offer (${human.name})</h4>
                        <label>Emeralds: <input type="number" id="trade-offer-emeralds" min="0" max="${human.emeralds}" value="0"></label>
                        <div class="trade-prop-list" id="trade-offer-props"></div>
                    </div>
                    <div class="trade-col">
                        <h4>You Request</h4>
                        <label>Emeralds: <input type="number" id="trade-request-emeralds" min="0" value="0"></label>
                        <div class="trade-prop-list" id="trade-request-props"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn craft-btn success" id="btn-send-trade">Offer Trade</button>
                    <button class="btn craft-btn close-btn" id="btn-cancel-trade">Cancel</button>
                </div>
            </div>
        `;
        this.tradeModalEl.classList.remove('hidden');

        const updatePropLists = () => {
            const partnerId = parseInt(document.getElementById('trade-partner').value, 10);
            const partner = this.gameState.players.find(p => p.id === partnerId);

            const offerContainer = document.getElementById('trade-offer-props');
            const reqContainer = document.getElementById('trade-request-props');
            offerContainer.innerHTML = '';
            reqContainer.innerHTML = '';

            Object.entries(this.gameState.properties).forEach(([tileId, prop]) => {
                const tile = BOARD_TILES[tileId];
                if (prop.owner === human.id) {
                    offerContainer.innerHTML += `
                        <label><input type="checkbox" value="${tileId}" class="offer-prop-check"> ${tile.name}</label>
                    `;
                } else if (prop.owner === partnerId) {
                    reqContainer.innerHTML += `
                        <label><input type="checkbox" value="${tileId}" class="req-prop-check"> ${tile.name}</label>
                    `;
                }
            });
        };

        document.getElementById('trade-partner').addEventListener('change', updatePropLists);
        updatePropLists();

        document.getElementById('btn-cancel-trade').addEventListener('click', () => {
            this.tradeModalEl.classList.add('hidden');
        });

        document.getElementById('btn-send-trade').addEventListener('click', () => {
            const partnerId = parseInt(document.getElementById('trade-partner').value, 10);
            const partner = this.gameState.players.find(p => p.id === partnerId);
            const offerEmeralds = parseInt(document.getElementById('trade-offer-emeralds').value, 10) || 0;
            const reqEmeralds = parseInt(document.getElementById('trade-request-emeralds').value, 10) || 0;

            const offerProps = Array.from(document.querySelectorAll('.offer-prop-check:checked')).map(el => parseInt(el.value, 10));
            const reqProps = Array.from(document.querySelectorAll('.req-prop-check:checked')).map(el => parseInt(el.value, 10));

            // Execute trade if AI accepts (simple fair valuation)
            let partnerAccepted = true;
            if (partner.isAI) {
                const offerVal = offerEmeralds + offerProps.reduce((sum, id) => sum + BOARD_TILES[id].cost, 0);
                const reqVal = reqEmeralds + reqProps.reduce((sum, id) => sum + BOARD_TILES[id].cost, 0);
                partnerAccepted = (offerVal >= reqVal * 0.9);
            }

            if (partnerAccepted) {
                human.emeralds -= offerEmeralds;
                partner.emeralds += offerEmeralds;
                partner.emeralds -= reqEmeralds;
                human.emeralds += reqEmeralds;

                offerProps.forEach(id => this.gameState.properties[id].owner = partner.id);
                reqProps.forEach(id => this.gameState.properties[id].owner = human.id);

                Sound.playEmeraldChime(false);
                Sound.playVillagerHuh();
                this.gameState.log(`🤝 Trade completed between ${human.name} and ${partner.name}!`, 'reward');
                this.tradeModalEl.classList.add('hidden');
                this.gameState.onStateChange();
            } else {
                Sound.playVillagerHuh();
                alert(`${partner.name} grunts ("Huuuh...") and declined your trade offer!`);
            }
        });
    }

    showVictoryModal(winner) {
        this.victoryModalEl.innerHTML = `
            <div class="modal-card victory-card">
                <h1>🏆 VICTORY! 🏆</h1>
                <h2>${winner.name} is the Master Crafter!</h2>
                <p>All other players were defeated or bankrupt.</p>
                <div class="victory-emeralds">Final Wealth: ${winner.emeralds} 🟩 Emeralds</div>
                <button class="btn craft-btn success" id="btn-play-again">Start New Game</button>
            </div>
        `;
        this.victoryModalEl.classList.remove('hidden');

        document.getElementById('btn-play-again').addEventListener('click', () => {
            this.victoryModalEl.classList.add('hidden');
            this.showSetupModal();
        });
    }

    showSetupModal() {
        this.setupModalEl.classList.remove('hidden');
    }

    handleSetupSubmit() {
        const count = parseInt(document.getElementById('player-count').value, 10);
        const configs = [];

        // Player 1 (Human)
        configs.push({
            name: document.getElementById('p1-name').value || "Steve (You)",
            isAI: false,
            token: document.getElementById('p1-token').value || "steve",
            color: "#00a8a8"
        });

        // Player 2
        configs.push({
            name: document.getElementById('p2-name').value || "Alex Bot",
            isAI: document.getElementById('p2-is-ai').checked,
            aiPersona: 'balanced',
            token: "alex",
            color: "#587b32"
        });

        // Player 3 (Optional)
        if (count >= 3) {
            const p3Name = document.getElementById('p3-name')?.value || "Creeper Bot";
            const p3IsAI = document.getElementById('p3-is-ai') ? document.getElementById('p3-is-ai').checked : true;
            configs.push({
                name: p3Name,
                isAI: p3IsAI,
                aiPersona: 'chaos',
                token: "creeper",
                color: "#1d5314"
            });
        }

        // Player 4 (Optional)
        if (count >= 4) {
            const p4Name = document.getElementById('p4-name')?.value || "Enderman Bot";
            const p4IsAI = document.getElementById('p4-is-ai') ? document.getElementById('p4-is-ai').checked : true;
            configs.push({
                name: p4Name,
                isAI: p4IsAI,
                aiPersona: 'cautious',
                token: "enderman",
                color: "#7e22ce"
            });
        }

        this.setupModalEl.classList.add('hidden');
        this.gameState.initGame(configs);
    }
}
