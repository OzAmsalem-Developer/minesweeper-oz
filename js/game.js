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
var gGame = {
    isOn: false,
    shownCount: 0,
    flaggedCount: 0,
    hintsCount: 3,
    hintMode: false,
    lives: 3,
    finds: 3,
    isManualMode: false,
    isPlacing: false,
    lightTheme: true
}
var gLevel = {
    SIZE: 8,
    MINES: 12
};

function init() {
    // switchMode is also using resetGame
    // (Thats why this 2 lines here)
    gGame.isManualMode = false;
    document.querySelector('.mode').innerText = 'Switch to manual';
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
            negsMinesCount(cellPos);
        }
    }
}

// Handle right click
function cellFlagged(elCell, posI, posJ) {
    let cell = gBoard[posI][posJ];
    if (!gGame.isOn || cell.isOpen) return;

    if (gOnProcces) return;
    if (gSecsPassed === 0 && gGame.shownCount === 0 && gGame.flaggedCount === 0) {
        //First click
        gTimerIvl = setInterval(startTimer, 1000);
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
    gGame.isOn = false;
    showAllMines();
    document.querySelector('.smiley').innerText = DEAD;
}

function showAllMines() {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            let cell = gBoard[i][j];
            if (cell.isMined) {
                let location = { i: i, j: j }
                let elCell = document.querySelector('.' + getClassName(location));
                // Model
                cell.isOpen = true;
                // DOM
                elCell.innerText = MINE;
            }
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
    gGame.isOn = false;
    document.querySelector('.smiley').innerText = WIN;
    renderBestScores();
    saveStep();
}

function useHint() {
    if (!gGame.isOn || gOnProcces) return;
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
    if (gOnProcces || !gGame.isOn) return;
    if (!gGame.finds) {
        alert('No more safe clicks');
        return;
    }
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

function placeMinesManually(elCell) { //(On mouseover)
    if (!gGame.isManualMode || !gGame.isPlacing) return;
    if (gMinesToPlace === gLevel.MINES) return;
    elCell.classList.add('on-placing-hover');
}

function hideMine(elCell) {  //On mouseout
    if (!gGame.isManualMode || !gGame.isPlacing) return;
    elCell.classList.remove('on-placing-hover');
    if (gMinesToPlace === gLevel.MINES) gGame.isPlacing = false;
}

function resetGame() {
    gGame.isOn = true;
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
    document.querySelector('.timer span').innerText = gSecsPassed;
    document.querySelector('.smiley').innerText = REGULAR;
    document.querySelector('.lives').innerText = LIVE + LIVE + LIVE;
    document.querySelector('.safe-click span').innerText = gGame.finds;
    document.querySelector('.hint span').innerText = gGame.hintsCount;
    renderBestScores();
}

function stepBack() {
    if (!gGame.isOn) gTimerIvl = setInterval(startTimer, 1000);
    if (!gGameSteps[gCurrStep - 1]) return; //No more steps back? return.
    // Model
    gGame = gGameSteps[gCurrStep - 1].game;
    gBoard = gGameSteps[gCurrStep - 1].board;
    // DOM
    // Render prev step board
    renderBoard(gBoard, '.board-container');
    // Render lives hints and finds
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
    if (gGame.lightTheme) {
        // Switch to dark Mode
        let btns = document.querySelectorAll('button');
        btns.forEach(function (btn) {
            btn.classList.remove('myButton');
            btn.classList.add('dark-mode-btn');
        });

        document.querySelector('body').style.backgroundColor = '#333333';
        document.querySelector('.timer').classList.remove('light-mode-timer');
        document.querySelector('.timer').classList.add('dark-mode-timer');
        document.querySelector('.best-score').style.color = '#f2fadc';
        let cells = document.querySelectorAll('.cell');
        cells.forEach(function (cell) {
            // if(!cell.classList.contains('clicked')) {
                cell.classList.remove('cell-light');
                cell.classList.add('cell-dark');
            // } 
        });

        elBtn.innerText = 'Light Mode';
        gGame.lightTheme = false;
    } else {
        // Switch to light Mode
        let btns = document.querySelectorAll('button');
        btns.forEach(function (btn) {
            btn.classList.add('myButton');
            btn.classList.remove('dark-mode-btn');
        });
        document.querySelector('body').style.backgroundColor = '#bbd1d8';
        document.querySelector('.timer').classList.remove('dark-mode-timer');
        document.querySelector('.timer').classList.add('light-mode-timer');
        document.querySelector('.best-score').style.color = 'black';
        let cells = document.querySelectorAll('.cell');
        cells.forEach(function (cell) {
            // if(!cell.classList.contains('clicked')) {
                cell.classList.add('cell-light');
                cell.classList.remove('cell-dark');
            // } 
        });

        elBtn.innerText = 'Dark Mode';
        gGame.lightTheme = true;
    }
}
