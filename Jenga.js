let stability = 100;
let gameActive = false;
let tower = [];
let pulledBlocks = [];
let blockData = [];

// Load block data from jenga.json
async function loadBlockData() {
    try {
        const response = await fetch(chrome.runtime.getURL('jenga.json'));
        if (!response.ok) throw new Error("Failed to load block data.");
        blockData = await response.json();
    } catch (error) {
        console.error("Error loading jenga.json:", error);
        return [];
    }
}

// Initialize tower with shuffled blocks
function initializeTower() {
    const shuffledBlocks = [...blockData];
    for (let i = shuffledBlocks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledBlocks[i], shuffledBlocks[j]] = [shuffledBlocks[j], shuffledBlocks[i]];
    }

    tower = [];
    for (let i = 0; i < shuffledBlocks.length; i += 3) {
        tower.push([shuffledBlocks[i], shuffledBlocks[i + 1], shuffledBlocks[i + 2]].filter(Boolean));
    }
}

// Randomized stability reduction
function reduceStability(action) {
    let reduction = Math.random() * (action === "pull" ? 10 : 5) + 2; // Pull: 2-10%, Place: 2-5%
    stability -= reduction;
    if (stability <= 0 || (stability <= 35 && Math.random() < 0.3)) {
        gameActive = false;
        return "The tower collapses! Game over.";
    }
    return null;
}

// Pull a block from the tower
function pullBlock() {
    if (!gameActive) return "No active game! Use !startjenga to begin.";
    if (tower.every(layer => layer.length === 0)) {
        gameActive = false;
        return "The tower collapses! Game over.";
    }

    let randomLayer;
    do {
        randomLayer = tower[Math.floor(Math.random() * tower.length)];
    } while (randomLayer.length === 0);

    const blockIndex = Math.floor(Math.random() * randomLayer.length);
    const pulledBlock = randomLayer.splice(blockIndex, 1)[0];
    pulledBlocks.push(pulledBlock);

    const collapseMessage = reduceStability("pull");
    return collapseMessage || `You pulled ${pulledBlock.block_id}. Challenge: ${pulledBlock.prompt} (Stability: ${stability.toFixed(1)}%)`;
}

// Place a pulled block on top of the tower
function placeBlock() {
    if (!gameActive) return "No active game! Use !startjenga to begin.";
    if (pulledBlocks.length === 0) return "No blocks available to place on top. Pull a block first!";

    const placedBlock = pulledBlocks.pop();
    const topLayer = tower[tower.length - 1];
    if (topLayer.length < 3) {
        topLayer.push(placedBlock);
    } else {
        tower.push([placedBlock]);
    }

    const collapseMessage = reduceStability("place");
    return collapseMessage || `You placed ${placedBlock.block_id} back on top of the tower. Stability: ${stability.toFixed(1)}%`;
}

// Start a new game
async function startGame() {
    stability = 100;
    gameActive = true;
    if (blockData.length === 0) await loadBlockData();
    initializeTower();
    pulledBlocks = [];
    return "A new Jenga game has started! Stability is at 100%. Use !pullblock to pull a block.";
}

// Reset the game
function resetGame() {
    stability = 100;
    gameActive = false;
    tower = [];
    pulledBlocks = [];
    return "The Jenga game has been reset. Use !startjenga to begin a new game.";
}

// Handle commands
async function handleCommand(command) {
    if (command === "!startjenga") return await startGame();
    if (command === "!pullblock") return pullBlock();
    if (command === "!placeblock") return placeBlock();
    if (command === "!resetjenga") return resetGame();
    return "Unknown command!";
}

// Event listener for Silly Tavern commands
window.addEventListener("sillyTavernCommand", async (event) => {
    const response = await handleCommand(event.detail.command);
    window.dispatchEvent(new CustomEvent("sillyTavernResponse", { detail: { message: response } }));
});
