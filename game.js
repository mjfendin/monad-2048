const boardSize = 4;
const board = document.getElementById("game-container");
const startButton = document.getElementById("start-button");
const tileImages = {
  2: "assets/images/2.png",
  4: "assets/images/4.png",
  8: "assets/images/8.png",
  16: "assets/images/16.png",
  32: "assets/images/32.png",
  64: "assets/images/64.png",
  128: "assets/images/128.png",
  256: "assets/images/256.png",
  512: "assets/images/512.png",
  1024: "assets/images/1024.png",
  2048: "assets/images/2048.png",
  4096: "assets/images/4096.png",
  8192: "assets/images/8192.png",
};

let grid = [];
let score = 0;
let startX, startY;

function updateScoreDisplay() {
  document.getElementById("score").textContent = "Score: " + score;
}

function initBoard() {
  grid = Array(boardSize)
    .fill()
    .map(() => Array(boardSize).fill(0));
  score = 0;
  updateScoreDisplay();
  addRandomTile();
  addRandomTile();
  render();
  FarcadeSDK?.singlePlayer?.actions?.ready?.();
}

function addRandomTile() {
  const empty = [];
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length > 0) {
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
}

function render() {
  board.innerHTML = "";
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.style.gridRow = r + 1;
      tile.style.gridColumn = c + 1;
      const val = grid[r][c];
      tile.style.backgroundImage = val ? `url(${tileImages[val]})` : "none";
      board.appendChild(tile);
    }
  }
}

function slideAndMerge(row) {
  let newRow = row.filter((n) => n);
  for (let i = 0; i < newRow.length - 1; ) {
    if (newRow[i] === newRow[i + 1]) {
      newRow[i] *= 2;
      score += newRow[i];
      FarcadeSDK?.singlePlayer?.actions?.hapticFeedback?.();
      newRow.splice(i + 1, 1);
    } else i++;
  }
  while (newRow.length < boardSize) newRow.push(0);
  return newRow;
}

function move(direction) {
  let moved = false;
  if (["left", "right"].includes(direction)) {
    for (let r = 0; r < boardSize; r++) {
      let row = grid[r];
      if (direction === "right") row = row.slice().reverse();
      const newRow = slideAndMerge(row);
      if (direction === "right") newRow.reverse();
      if (grid[r].join() !== newRow.join()) moved = true;
      grid[r] = newRow;
    }
  } else {
    for (let c = 0; c < boardSize; c++) {
      let col = grid.map((row) => row[c]);
      if (direction === "down") col = col.slice().reverse();
      const newCol = slideAndMerge(col);
      if (direction === "down") newCol.reverse();
      for (let r = 0; r < boardSize; r++) {
        if (grid[r][c] !== newCol[r]) moved = true;
        grid[r][c] = newCol[r];
      }
    }
  }
  if (moved) {
    addRandomTile();
    render();
    updateScoreDisplay();
    if (isGameOver()) FarcadeSDK?.singlePlayer?.actions?.gameOver?.({ score });
  }
}

function isGameOver() {
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (grid[r][c] === 0) return false;
      if (c < boardSize - 1 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < boardSize - 1 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

function handleGesture(dir) {
  move(dir);
}

board.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
});

board.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - startX;
  const dy = e.changedTouches[0].clientY - startY;
  handleGesture(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down");
});

window.addEventListener("keydown", (e) => {
  const keys = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
  };
  if (keys[e.key]) handleGesture(keys[e.key]);
});

startButton.addEventListener("click", () => {
  startButton.style.display = "none";
  board.style.display = "grid";
  initBoard();
});

FarcadeSDK?.on?.("play_again", () => {
  initBoard();
});

FarcadeSDK?.on?.("toggle_mute", (data) => {
  console.log("Muted?", data.isMuted);
});
