'use strict';
const MINE = '💥';
const FLAG = '🚩';
const DEAD = '😵';
const WIN = '😎';
const REGULAR = '🙂';
const LIVE = '❤️';
var gBoard;
var gGameSteps = [];
var gCurrStep;
var gTimerIvl;
var gOnProcces;
var gMinesToPlace;
var gSecsPassed = 0;
var gIsLightMode = true;
var gIsGameOn; //Exclude from gGame for UNDO purposes

var gGame = {
    isOn: false,
    shownCount: 0,
    flaggedCount: 0,
    hintsCount: 3,
    hintMode: false,
    lives: 3,
    finds: 3,
    isManualMode: false,
    isPlacing: false
}
var gLevel = {
    SIZE: 8,
    MINES: 12
};
// Start with dark mode
changeTheme(document.querySelector('.theme'));

function init() {
    gGame.isManualMode = false;
    // Left of game settings to reset
    resetGame();
}

function placeMines(numOfMines, firstPos) {
    for (let i = 0; i < numOfMines; i++) {
        let posI = getRandomIntInclusive(0, gBoard.length - 1);
        let posJ = getRandomIntInclusive(0, gBoard[0].length - 1);
        let cell = gBoard[posI][posJ];

        if (cell.isMined || cell.isOpen || (posI === firstPos.i && posJ === firstPos.j) ||
            (Math.abs(firstPos.i - posI) <= 1 && Math.abs(firstPos.j - posJ) <= 1)) {
            //Already mined/opened/its first click position or one of his negs? add a round and continue
            // First click or his negs never contain a mine
            i--;
            continue;
        } else {
            cell.isMined = true;
        }
    }
}

function negsMinesCount(cellPos) {
    let minesCount = 0;
    for (let i = cellPos.i - 1; i <= cellPos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (let j = cellPos.j - 1; j <= cellPos.j + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            if (i === cellPos.i && j === cellPos.j) continue;
            let cell = gBoard[i][j];
            if (cell.isMined) minesCount++;
        }
    }
    gBoard[cellPos.i][cellPos.j].minedNegsCount = minesCount;
}

function minedNegsCountForEveryone() {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            let cellPos = { i: i, j: j }
            let cell = gBoard[i][j];
            if(cell.isMined) continue;
            negsMinesCount(cellPos);
        }
    }
}

// Handle right click
function cellFlagged(elCell, posI, posJ) {
    let cell = gBoard[posI][posJ];
    if (!gIsGameOn || cell.isOpen || gOnProcces) return;

    if (gSecsPassed === 0 && gGame.shownCount === 0 && gGame.flaggedCount === 0) {
        //First click is a flag? place mines, count and start timer
        gTimerIvl = setInterval(startTimer, 1000);
        placeMines(gLevel.MINES, { i: posI, j: posJ });
        minedNegsCountForEveryone();
    }
    if (!cell.isFlagged) {
        //Model
        cell.isFlagged = true;
        gGame.flaggedCount++;
        saveStep();
        //DOM
        elCell.innerText = FLAG;
        //Check if user wins
        if (isUserWin()) onUserWin();
    } else {
        //Model
        cell.isFlagged = false;
        gGame.flaggedCount--;
        saveStep();
        //DOM
        elCell.innerText = '';
    }

}

function changeLevel(size, numOfMines) {
    //Update gLevel Model
    gLevel.SIZE = size;
    gLevel.MINES = numOfMines;
    //Clear timer
    clearInterval(gTimerIvl);
    init();
}

function gameOver() {
    clearInterval(gTimerIvl);
    gIsGameOn = false;
    // Not updating the Model here in order to enable UNDO
    showAllMines();
    checkUserFlags();
    document.querySelector('.smiley').innerText = DEAD;
}

function showAllMines() {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            let cell = gBoard[i][j];
            if (cell.isMined && !cell.isFlagged) {
                let location = { i: i, j: j }
                let elCell = document.querySelector('.' + getClassName(location));
                // Not updating the Model here in order to enable UNDO
                // DOM
                elCell.innerText = MINE;
            }
        }
    }
}

function checkUserFlags() {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            let cell = gBoard[i][j];
            if (!cell.isFlagged) continue;
                let location = { i: i, j: j }
                let elCell = document.querySelector('.' + getClassName(location));
            if(!cell.isMined) elCell.classList.add('x-overlay');
            if(gLevel.SIZE === 4) elCell.classList.add('x-overlay-easy');
            if(gLevel.SIZE === 8) elCell.classList.add('x-overlay-medium');
        }
    }
}

function isUserWin() {
    if (gGame.shownCount === gLevel.SIZE ** 2 - gLevel.MINES &&
        gGame.flaggedCount === gLevel.MINES) return true;
    return false;
}

function onUserWin() {
    let level = (gLevel.SIZE === 12) ? 'Hard' : (gLevel.SIZE === 8) ? 'Medium' : 'Easy';
    let bestScore = +localStorage.getItem(level)
    if (bestScore > gSecsPassed || !bestScore) localStorage.setItem(level, gSecsPassed);
    clearInterval(gTimerIvl);
    gIsGameOn = false;
    document.querySelector('.smiley').innerText = WIN;
    renderBestScores();
    saveStep();
}

function useHint() {
    if (!gIsGameOn || gOnProcces) return;
    if (!gGame.hintsCount) {
        alert('You have no more hints');
        gGame.hintMode = false;
        return;
    }
    gGame.hintMode = true;
}

function showNegsAndHide(posI, posJ) {
    gOnProcces = true;
    for (let i = posI - 1; i <= posI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (let j = posJ - 1; j <= posJ + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;

            let cell = gBoard[i][j];
            let location = { i: i, j: j };
            let elCell = document.querySelector('.' + getClassName(location));
            if (cell.isOpen) continue;

            elCell.classList.add('clicked');
            elCell.style.color = getCellColor(cell.minedNegsCount);
            if (cell.isMined) elCell.innerText = MINE;
            else if (cell.minedNegsCount) elCell.innerText = cell.minedNegsCount
            setTimeout(() => {
                elCell.innerText = (cell.isFlagged) ? FLAG : '';
                gGame.hintMode = false;
                gOnProcces = false;
                elCell.classList.remove('clicked');
            }, 1000);
        }
    }
}

function steppedOnMine(elCell) {
    gGame.lives--;
    let elLives = document.querySelector('.lives');
    if (gGame.lives === 2) elLives.innerText = LIVE + LIVE;
    else if (gGame.lives === 1) elLives.innerText = LIVE;
    else elLives.innerText = ''; //No more lives

    gOnProcces = true;
    elCell.innerText = MINE;
    setTimeout(() => {
        elCell.innerText = '';
        gOnProcces = false;
    }, 1000);
}

function renderBestScores() {
    let easyBestScore = localStorage.getItem('Easy');
    let mediumBestScore = localStorage.getItem('Medium');
    let hardBestScore = localStorage.getItem('Hard');

    if (easyBestScore) document.querySelector('.easy').innerText = easyBestScore + ' Secs';
    if (mediumBestScore) document.querySelector('.medium').innerText = mediumBestScore + ' Secs';
    if (hardBestScore) document.querySelector('.hard').innerText = hardBestScore + ' Secs';
}

function showSafeClick() {
    if (gOnProcces || !gIsGameOn) return;
    if (!gGame.finds) {
        alert('No more safe clicks');
        return;
    }
    // if there is no more safe cells, bye
    if (gGame.shownCount + gLevel.MINES === gLevel.SIZE ** 2) return;
    let i = getRandomIntInclusive(0, gBoard.length - 1);
    let j = getRandomIntInclusive(0, gBoard.length - 1);
    let safeCell = gBoard[i][j];
    while (safeCell.isMined || safeCell.isOpen) {
        i = getRandomIntInclusive(0, gBoard.length - 1);
        j = getRandomIntInclusive(0, gBoard.length - 1);
        safeCell = gBoard[i][j];
    }
    let location = { i: i, j: j }
    let elSafeCell = document.querySelector('.' + getClassName(location));
    gOnProcces = true;
    gGame.finds--;
    saveStep();
    document.querySelector('.safe-click span').innerText = gGame.finds;
    elSafeCell.classList.add('reveal');
    setTimeout(() => {
        elSafeCell.classList.remove('reveal');
        gOnProcces = false;
    }, 1000);
}

function switchMode(elBtn) {
    resetGame();
    if (!gGame.isManualMode) {
        gGame.isManualMode = true;
        gGame.isPlacing = true;
        elBtn.innerText = 'Switch to regular';
        alert('Place ' + gLevel.MINES + ' Mines');
        gMinesToPlace = 0;
    } else {
        gGame.isManualMode = false;
        gGame.isPlacing = false;
        elBtn.innerText = 'Switch to manual'
    }
}

function onMouseOver(elCell, posI, posJ) { //(On mouseover)
    if (gGame.isManualMode && gGame.isPlacing) {
        if (gMinesToPlace === gLevel.MINES) return;
        elCell.classList.add('on-placing-hover');
    } if (gGame.hintMode) {
        if (gGame.shownCount === 0 && !gGame.isManualMode) {
            gGame.hintMode = false;
            return; //Not available on first click
        }
        handleNegsOnHint(posI, posJ, false);
    }
}

function onMouseOut(elCell, posI, posJ) {  //On mouseout
    if (gGame.isManualMode && gGame.isPlacing) {
        elCell.classList.remove('on-placing-hover');
        if (gMinesToPlace === gLevel.MINES) gGame.isPlacing = false;
    } if (gGame.hintMode) {
        if (gGame.shownCount === 0 && !gGame.isManualMode) {
            gGame.hintMode = false;
            return; //Not available on first click
        }
        handleNegsOnHint(posI, posJ, true);
    }
}

function handleNegsOnHint(posI, posJ, isMarked) {
    for (let i = posI - 1; i <= posI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (let j = posJ - 1; j <= posJ + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            let elCell = document.querySelector('.' + getClassName({ i: i, j: j }));
            if (isMarked) elCell.classList.remove('on-hint-hover');
            else elCell.classList.add('on-hint-hover');
        }
    }
}

function resetGame() {
    gIsGameOn = true;
    gGame.shownCount = 0;
    gGame.flaggedCount = 0;
    gSecsPassed = 0;
    gGame.hintsCount = 3;
    gGame.lives = 3;
    gGame.finds = 3;
    gOnProcces = false;
    gBoard = createBoard(gLevel.SIZE);
    renderBoard(gBoard, '.board-container');
    gGameSteps = [];
    gCurrStep = 0;

    clearInterval(gTimerIvl);
    document.querySelector('.timer span').innerText = '00:00:00';
    document.querySelector('.smiley').innerText = REGULAR;
    document.querySelector('.lives').innerText = LIVE + LIVE + LIVE;
    document.querySelector('.safe-click span').innerText = gGame.finds;
    document.querySelector('.hint span').innerText = gGame.hintsCount;
    document.querySelector('.mode').innerText = 'Switch to manual';
    renderBestScores();
}

function stepBack() {
    // Step back from game over? the timer start again
    if (!gIsGameOn) {
        gTimerIvl = setInterval(startTimer, 1000);
        gIsGameOn = true;
    } 
    if (!gGameSteps[gCurrStep - 1]) return; //No more steps back? bye.
    // Model
    gGame = gGameSteps[gCurrStep - 1].game;
    gBoard = gGameSteps[gCurrStep - 1].board;
    // Dont remember hintMode
    gGame.hintMode = false;
    // DOM
    // Render prev step board
    renderBoard(gBoard, '.board-container');
    // Render lives, hints and finds
    let elLives = document.querySelector('.lives');
    if (gGame.lives === 3) elLives.innerText = LIVE + LIVE + LIVE;
    else if (gGame.lives === 2) elLives.innerText = LIVE + LIVE;
    else if (gGame.lives === 1) elLives.innerText = LIVE;
    else elLives.innerText = ''; //No more lives

    document.querySelector('.safe-click span').innerText = gGame.finds;
    document.querySelector('.hint span').innerText = gGame.hintsCount;
    document.querySelector('.smiley').innerText = REGULAR;
    gCurrStep--;

    //User step back to the start? reset the gGameSteps array and start save from scratch
    if (gCurrStep === 0) {
        gGameSteps = [];
        saveStep();
    }
}

function saveStep() {
    // JSON.parse and JSON.stringify (Deep copy)
    // JSON.stringify turns an object into a string.
    // JSON.parse turns a string into an object.
    // Combining them can turn an object into a string, 
    // and then reverse the process to create a brand new data structure.
    let board = JSON.parse(JSON.stringify(gBoard));
    let game = JSON.parse(JSON.stringify(gGame));
    gGameSteps.push({ board: board, game: game });
    gCurrStep = gGameSteps.length - 1;
}

function changeTheme(elBtn) {
    if (gIsLightMode) {
        // Switch to dark Mode
        let btns = document.querySelectorAll('button');
        btns.forEach(function (btn) {
            btn.classList.add('dark-mode-btn');
        });

        document.querySelector('body').style.backgroundColor = '#333333';
        document.querySelector('.best-score').style.color = '#f2fadc';
        document.querySelector('.timer').classList.add('dark-mode-btn');
        document.querySelector('.lives').classList.add('dark-mode-btn');
        let cells = document.querySelectorAll('.cell');
        cells.forEach(function (cell) {
            cell.classList.remove('cell-light');
            cell.classList.add('cell-dark');
        });

        elBtn.innerText = 'Light Mode';
        gIsLightMode = false;
    } else {
        // Switch to light Mode
        let btns = document.querySelectorAll('button');
        btns.forEach(function (btn) {
            console.log(btn);
            
            btn.classList.remove('dark-mode-btn');
        });
        document.querySelector('body').style.backgroundColor = '#fffaae';
        document.querySelector('.timer').classList.remove('dark-mode-btn');
        document.querySelector('.lives').classList.remove('dark-mode-btn');
        document.querySelector('.best-score').style.color = 'black';
        let cells = document.querySelectorAll('.cell');
        cells.forEach(function (cell) {
            cell.classList.add('cell-light');
            cell.classList.remove('cell-dark');
        });

        elBtn.innerText = 'Dark Mode';
        gIsLightMode = true;
    }
}
