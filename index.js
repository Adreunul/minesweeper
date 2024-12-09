const gameBoard = document.querySelector('.game-board');
const gameInfoContainer = document.querySelector('.game-info-container');
const timer = document.querySelector('.game-timer');
const bombCounter = document.querySelector('.bomb-counter');
const gameOverMessage = document.querySelector('.game-over-message');
const newGameButton = document.querySelector('.new-game-button');
const width = 18; // Number of columns
const height = 14; // Number of rows
const bombsFromSettings = 80; // Number of bombs
var bombs = bombsFromSettings;
var userHasStarted = false;
var gameHasEnded = false;
var gameMatrix = [];
var userFlags = [];

newGameButton.addEventListener('click', () => {
        handleUserRestart();
}); 

function initializeGameMatrix() {
    gameMatrix = Array.from({ length: height }, () => Array(width).fill(0));
}

function initializeUserFlags() {
    userFlags = Array.from({ length: height }, () => Array(width).fill(0));
}

// Function to initialize the game board
function initializeGameBoard() {
    // Set the CSS grid layout properties
    gameBoard.innerHTML = '';
    gameBoard.style.display = 'grid';
    gameBoard.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(${height}, 1fr)`;
    gameBoard.style.gap = '0px'; // Optional: spacing between cells

    // Create cells for the grid
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const cell = document.createElement('button');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;

            // Optional: Add event listeners for interactivity
            cell.addEventListener('click', () => onCellClick(row, col));
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                onCellRightClick(row, col);
            });

            // Append the cell to the game board
            gameBoard.appendChild(cell);
        }
    }

    console.log("cali cali is a state murder : ");
}

async function initializeGameStats(){
    initializeTimer();
    initializeBombCounter();
}

function initializeTimer(){
    let timeElapsed = 0;

    bombCounter.textContent = bombs;
    timer.textContent = timeElapsed;

    const intervalId = setInterval(() => {
        if(!gameHasEnded && userHasStarted){
            timeElapsed++;
            if(timeElapsed === 999) {
                timer.textContent = '999+';
                clearInterval(intervalId);
            }
            else 
                timer.textContent = timeElapsed;
        }
    }, 1000);

    return intervalId;
}

function initializeBombCounter() {
    let upto = 0;
    let lastUpdate = performance.now(); // Initialize with the current time
    const delay = 25; // Delay in milliseconds between updates

    function updated(timestamp) {
        if(userHasStarted){
            if (timestamp - lastUpdate >= delay) {
                lastUpdate = timestamp; // Update the last update time
                bombCounter.innerHTML = ++upto;
            }

            if (upto < bombs) {
                requestAnimationFrame(updated);
            }
        }
    }

    requestAnimationFrame(updated); // Start the counter
}


// Function to randomly place bombs
async function initializeBombs(row, col) {
    userHasStarted = true;
    let bombCount = 0;

    while (bombCount < bombs) {
        let bombRow = Math.floor(Math.random() * height);
        let bombCol = Math.floor(Math.random() * width);

        // Check if the bomb is in the 3x3 area around the clicked cell
        if (
            bombRow >= row - 1 && bombRow <= row + 1 && // Row is within the safe zone
            bombCol >= col - 1 && bombCol <= col + 1    // Column is within the safe zone
        ) continue;

        // Place the bomb if the cell is empty
        if (gameMatrix[bombRow][bombCol] === 0) {
            gameMatrix[bombRow][bombCol] = 1;
            bombCount++;
        }
    }
}


// Event handler for left click
async function onCellClick(row, col) {
    if(gameHasEnded) return;
    if(!userHasStarted){ // Place bombs on the board
        userHasStarted = true;

        initializeGameStats();
        await initializeBombs(row, col);
    }

    if(gameMatrix[row][col] === 1) { // User clicked on a bomb
        handleUserLoss(row, col);
        return;
    } else {
        console.log(`Clicked on: Row ${row}, Col ${col}`);
        await revealCell(row, col);
    }
}


function handleUserLoss(row, col)
{
    const cell = getCell(row, col);
    gameOverMessage.classList.remove('hidden');
    //userHasStarted = false;
    gameHasEnded = true;

    var playedTime = timer.textContent;
    timer.textContent = playedTime;

    gameInfoContainer.style.marginBottom = '.5rem'; // for not gaining space between "eyes" and game board
    newGameButton.style.marginBottom = '.5rem';

    cell.innerHTML = '<img src="./img/mine.png" style="width:20px;height:20px;">'; //how do you write emojis ? 
    cell.style.backgroundColor = '#fa6e37be';
    gameBoard.style.border = '8px solid #fa6e37be';

    revealBombs();
    revealWrongFlags();
}

async function revealBombs(){
    for(let i = 0; i < height; i++){
        for(let j = 0; j < width; j++){
            if(gameMatrix[i][j] === 1){
                const cell = getCell(i, j);
                cell.classList.add('revealed');
                cell.disabled = true;
                cell.innerHTML = '<img src="./img/mine.png" style="width:20px;height:20px;">';
            }
        }
    }
}

async function revealWrongFlags(){
    for(let i = 0; i < height; i++){
        for(let j = 0; j < width; j++){
            if(userFlags[i][j] === 1 && gameMatrix[i][j] === 0){
                const cell = getCell(i, j);
                cell.classList.toggle('flagged');
                cell.classList.toggle('wrong-flag');
                cell.innerHTML = '<img src="./img/wrong-flag.png" style="width:20px;height:20px;">';
            }
        }
    }
}


async function handleUserRestart(){
    gameInfoContainer.style.marginBottom = '2rem';
    newGameButton.style.marginBottom = '2rem';
    gameOverMessage.classList.add('hidden');

    userHasStarted = false;
    gameHasEnded = false;
    gameMatrix = [];
    bombs = bombsFromSettings;

    bombCounter.textContent = 0;
    timer.textContent = 0;

    initializeGameMatrix();
    initializeUserFlags();
    initializeGameBoard();
    //initializeGameStats();
}

// Event handler for right click
function onCellRightClick(row, col) {
    if(userHasStarted && !gameHasEnded)
        handleCellFlagging(row, col);
}

function handleCellFlagging(row, col){
    const cell = getCell(row, col);
    if(!cell.classList.contains('revealed')){
        console.log(`Right-clicked on: Row ${row}, Col ${col}`);
        cell.classList.toggle('flagged');
        if(cell.classList.contains('flagged')){
            bombs--;
            
            userFlags[row][col] = 1;
            cell.textContent = 'X';
            //cell.disabled = true;
        }
        else {
            bombs++;

            userFlags[row][col] = 0;
            cell.textContent = '';
            cell.disabled = false;
        }
        bombCounter.textContent = bombs;
    }
}


function getCell(row, col) {
    return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

// When a cell is revealed
async function getCellNumber(row, col){
    let cellNumber = 0;
    for(let i = row - 1; i <= row + 1; i++){
        for(let j = col - 1; j <= col + 1; j++){
            if(i < 0 || i >= height || j < 0 || j >= width) continue;
            if(gameMatrix[i][j] === 1) cellNumber++;
        }
    }

    return cellNumber;
}

async function handleZeroCell(row, col){
    for(let i = row - 1; i <= row + 1; i++){
        for(let j = col - 1; j <= col + 1; j++){
            if(i < 0 || i >= height || j < 0 || j >= width) continue;
            if(gameMatrix[i][j] === 0){
                const cell = await getCell(i, j);
                if(cell.classList.contains('revealed')) continue;
                if(cell.classList.contains('flagged'))
                    handleCellFlagging(i, j);
                revealCell(i, j);
            }
        }
    }
}

async function revealCell(row, col) {
    const cell = getCell(row, col);
    cell.classList.add('revealed');
    cell.disabled = true;
    const cellNumber = await getCellNumber(row, col);

    if(cellNumber > 0){
        setCellNumberColor(cell, cellNumber);
        cell.textContent = cellNumber;
    }

    if(cellNumber === 0){
        handleZeroCell(row, col);
        cell.classList.add('zero-cell');
        cell.classList.add('disabled');
    }

    console.log("Cell Number: ", cellNumber);
}

function setCellNumberColor(cell, cellNumber){
    switch(cellNumber){
        case 1:
            cell.style.color = '#092b66';
            break;
        case 2:
            cell.style.color = '#e21c0e';
            break;
        case 3:
            cell.style.color = '#097429';
            break;
        case 4:
            cell.style.color = '#a76003';
            break;
        case 5:
            cell.style.color = '#a51309';
            break;
        case 6:
            cell.style.color = '#04521b';
            break;
        case 7:
            cell.style.color = '#00a2ff';
            break;
        case 8:
            cell.style.color = '#c300ff';
            break;
        default:
            cell.style.color = 'black';
            break;
    }
}

// Initialize the board when the page loads
initializeGameMatrix();
initializeUserFlags();
initializeGameBoard();
//initializeGameStats();

