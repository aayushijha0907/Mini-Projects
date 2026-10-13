# The Minecraft Chronicles: Stick-Craft Tabletop Edition

A complete, standalone 4-player web-based Monopoly board game featuring a **rustic homemade stick/twig craft aesthetic** and authentic **Minecraft themes**, powered by **canvas physics** for tumbling dice and tactile token movement.

---

## 🪵 Key Features

- **Stick-Craft Aesthetic**: The board is procedurally framed with realistic textured wood logs, slender twig dividers, and tied twine rope corner joints around aged parchment cards.
- **Minecraft Lore**:
  - **40 Authentic Spaces**: Dirt Path, Oak Plains, Birch Forest, Taiga, Desert, Badlands, Swamps, Jungles, Oceans, Deep Dark, The Nether, and The End.
  - **Minecarts**: Chest Minecart, Furnace Minecart, Hopper Minecart, and TNT Minecart.
  - **Utilities**: Redstone Lamp and Nether Portal & Enchanting Table.
  - **Dungeon / Jail**: Bedrock Prison guarded by Iron Bars and Warden Ambush.
  - **Emeralds**: The official Minecraft currency (🟩) used for all property purchases, rents, and auctions.
  - **Cards**: Break Lucky Blocks (Chance) and open Treasure Chests (Community Chest).
- **Physical Canvas Engine**:
  - **Dice Pit**: Real 2.5D tumbling dice physics that bounce off wooden stick boundaries with randomized velocity and angular momentum.
  - **Tactile Tokens**: Handcrafted wooden figurines (Steve, Alex, Creeper, Pig, Enderman, Iron Golem) with dynamic drop shadows, parabolic hopping physics, squash-and-stretch on landing, and interactive drag-and-drop.
- **Rules & Mechanics**: Full Monopoly rules including color set monopolies, building Wooden Huts (houses) and Nether Beacons (hotels), mortgage/unmortgage, jail fine / doubles escape / Ender Pearl cards, and trade negotiations.
- **Smart AI Bots**: Play solo against automated Minecraft bot opponents or pass-and-play with friends.
- **Procedural Sound**: Web Audio API synthesized wooden clacks, dice rattles, emerald coin chimes, creeper hisses, and villager murmurs (no external audio files required).

---

## 🚀 How to Play

### Option 1: Direct Double-Click (Zero Setup)
Simply open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari):
```
C:\Users\Aayushi\.gemini\antigravity\scratch\minecraft-stick-monopoly\index.html
```

### Option 2: Local HTTP Server (Optional)
If you prefer running via a local web server:
```powershell
cd C:\Users\Aayushi\.gemini\antigravity\scratch\minecraft-stick-monopoly
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your web browser.

---

## 🎮 Controls

- **Roll Dice**: Click the green **🎲 Roll Dice** button or throw the dice.
- **Move Pieces**: Watch your token leap gracefully across the parchment tiles, or click and drag your wooden figurine to lift it with physical gravity and shadows.
- **Inspect Spaces**: Click any space on the board to view its detailed parchment Property Deed, mortgage values, and build shelters.
- **Barter & Trade**: Click **🤝 Trade** to negotiate trades with AI bots or players.
- **Speed Control**: Toggle between **1x Speed** and **⚡ 2x Speed** for faster bot turns.
- **Sound Toggle**: Toggle sound effects anytime using the **🔊 Sound On** button in the top navigation bar.

---

## 📂 Project Structure

```
minecraft-stick-monopoly/
├── index.html            # Main HTML layout, HUD, board canvas, and modal templates
├── css/
│   └── style.css         # Homemade stick & craft paper styling, pixel accents
└── js/
    ├── config.js         # 40 Minecraft board spaces, cards, tokens, color sets
    ├── audio.js          # Web Audio API procedural sound synthesizer
    ├── physics.js        # 2.5D dice simulation & token physics (hops, drag & drop)
    ├── board_renderer.js # Canvas engine for stick frame, twine knots, parchment, tokens
    ├── game_state.js     # Monopoly rules engine (turns, rent, huts, jail, bankruptcy)
    ├── ai.js             # Automated bot player decision heuristics
    ├── ui.js             # Player HUD, deed popups, card animations, trade modal
    └── main.js           # 60 FPS animation loop, canvas event listeners, setup
```
