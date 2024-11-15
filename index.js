let stability = 100;
let gameActive = true;
let tower = [];
let pulledBlocks = [];
let blockData = [];

// Load block data from jenga.json
async function loadBlockData() {
    try {
        const response = await fetch('path/to/jenga.json');
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

// Pull a block from the tower
function pullBlock() {
    if (!gameActive) return "The game is over! Reset to start again.";
    if (stability <= 0 || tower.every(layer => layer.length === 0)) {
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
    stability -= 5;

    return `You pulled ${pulledBlock.block_id}. Challenge: ${pulledBlock.prompt} (Stability: ${stability}%)`;
}

// Place a pulled block on top of the tower
function placeBlock() {
    if (pulledBlocks.length === 0) return "No blocks available to place on top. Pull a block first!";
    if (!gameActive) return "The game is over! Reset to start again.";

    const placedBlock = pulledBlocks.pop();
    const topLayer = tower[tower.length - 1];
    if (topLayer.length < 3) {
        topLayer.push(placedBlock);
    } else {
        tower.push([placedBlock]);
    }

    stability -= 2;
    return `You placed ${placedBlock.block_id} back on top of the tower. Stability: ${stability}%`;
}

// Reset the game
async function resetGame() {
    stability = 100;
    gameActive = true;
    if (blockData.length === 0) await loadBlockData();
    initializeTower();
    pulledBlocks = [];
    return "The Jenga game has been reset. Stability is back to 100%. The tower has 54 blocks again in 18 randomized layers.";
}

// Handle commands
function handleCommand(command) {
    if (command === "!pullblock") return pullBlock();
    if (command === "!placeblock") return placeBlock();
    if (command === "!resetjenga") return resetGame();
    return "Unknown command!";
}

// Event listener for Silly Tavern commands
window.addEventListener("sillyTavernCommand", (event) => {
    const response = handleCommand(event.detail.command);
    window.dispatchEvent(new CustomEvent("sillyTavernResponse", { detail: { message: response } }));
});
