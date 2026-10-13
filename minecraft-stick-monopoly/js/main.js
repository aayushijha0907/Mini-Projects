/**
 * Main Game Bootstrap & 60 FPS Animation Loop
 * Initializes Canvas, Physics, Renderer, Audio, and Event Listeners.
 */

// Global singletons
let GameStateInstance = null;
let BoardRendererInstance = null;
let UIControllerInstance = null;

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('board-canvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }

    // Initialize Canvas Resolution
    const boardResolution = 920;
    canvas.width = boardResolution;
    canvas.height = boardResolution;

    // Create Game Engine Instances
    BoardRendererInstance = new BoardRenderer(canvas);
    GameStateInstance = new GameState();
    UIControllerInstance = new UIController(GameStateInstance, Sound);

    // Initialize Dice in Physics Tray
    Physics.initDice(BoardRendererInstance.dicePitBounds);

    // Canvas Interaction Event Listeners (Drag-and-Drop & Tile Click)
    let isMouseDown = false;
    let didDragToken = false;
    let clickStartX = 0;
    let clickStartY = 0;

    canvas.addEventListener('mousedown', (e) => {
        Sound.init();
        isMouseDown = true;
        didDragToken = false;

        const pos = BoardRendererInstance.screenToBoard(e.clientX, e.clientY);
        clickStartX = pos.x;
        clickStartY = pos.y;

        const dragged = Physics.startDrag(pos.x, pos.y);
        if (dragged) {
            didDragToken = true;
        }
    });

    window.addEventListener('mousemove', (e) => {
        const pos = BoardRendererInstance.screenToBoard(e.clientX, e.clientY);

        if (isMouseDown && didDragToken) {
            Physics.onDragMove(pos.x, pos.y);
        } else {
            // Hover tile detection
            const tileId = BoardRendererInstance.getTileAt(pos.x, pos.y);
            BoardRendererInstance.hoveredTile = tileId;
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (!isMouseDown) return;
        isMouseDown = false;

        const pos = BoardRendererInstance.screenToBoard(e.clientX, e.clientY);
        const distMoved = Math.sqrt((pos.x - clickStartX) ** 2 + (pos.y - clickStartY) ** 2);

        if (didDragToken) {
            Physics.endDrag();
        } else if (distMoved < 10) {
            // User clicked a tile without dragging
            const tileId = BoardRendererInstance.getTileAt(pos.x, pos.y);
            if (tileId !== null) {
                BoardRendererInstance.selectedTile = tileId;
                UIControllerInstance.showDeedModal(tileId);
            }
        }
        didDragToken = false;
    });

    // Touch Support for mobile / touchpads
    canvas.addEventListener('touchstart', (e) => {
        Sound.init();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const pos = BoardRendererInstance.screenToBoard(touch.clientX, touch.clientY);
            clickStartX = pos.x;
            clickStartY = pos.y;
            const dragged = Physics.startDrag(pos.x, pos.y);
            if (dragged) didDragToken = true;
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (didDragToken && e.touches.length === 1) {
            const touch = e.touches[0];
            const pos = BoardRendererInstance.screenToBoard(touch.clientX, touch.clientY);
            Physics.onDragMove(pos.x, pos.y);
            e.preventDefault();
        }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        if (didDragToken) {
            Physics.endDrag();
            didDragToken = false;
        }
    });

    // Launch default 4-player game immediately (Steve, Alex Bot, Creeper Bot, Enderman Bot)
    GameStateInstance.initGame([
        {
            name: "Steve (You)",
            isAI: false,
            token: "steve",
            color: "#00a8a8"
        },
        {
            name: "Alex Bot",
            isAI: true,
            aiPersona: "balanced",
            token: "alex",
            color: "#587b32"
        },
        {
            name: "Creeper Bot",
            isAI: true,
            aiPersona: "chaos",
            token: "creeper",
            color: "#1d5314"
        },
        {
            name: "Enderman Bot",
            isAI: true,
            aiPersona: "cautious",
            token: "enderman",
            color: "#7e22ce"
        }
    ]);

    // 60 FPS Game Render & Physics Loop
    let lastTime = performance.now();

    function gameLoop(currentTime) {
        const dt = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        // Step physics
        Physics.update(dt);

        // Render board, tokens, dice, and stick borders
        BoardRendererInstance.render(GameStateInstance);

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
});
