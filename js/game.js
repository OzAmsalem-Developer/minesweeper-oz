'use strict';
const MINE = '💥';
const FLAG = '🚩';
const DEAD = '😵';
const WIN = '😎';
const REGULAR = '🙂';
const LIVE = '❤️';

var gBoard;
var gTimerIvl;
var gOnProcces;
var gGame = {
    isOn: false,
    shownCount: 0,
    flaggedCount: 0,
    secsPassed: 0,
    hintsCount: 3,
    hintMode: false,
    lives: 3,
    finds: 3
}
var gLevel = {
    SIZE: 8,
    MINES: 12
};

function init() {
    gGame.isOn = true;
    gGame.shownCount = 0;
    gGame.flaggedCount = 0;
    gGame.secsPassed = 0;
    gGame.hintsCount = 3;
    gGame.lives = 3;
    gGame.finds = 3;
    gOnProcces = false;
    clearInterval(gTimerIvl);
    document.querySelector('.timer span').innerText = gGame.secsPassed;
    document.querySelector('.smiley').innerText = REGULAR;
    document.querySelector('.lives').innerText = LIVE + LIVE + LIVE;
    document.querySelector('.safe-click span').innerText = gGame.finds;
    renderBestScores();

    gBoard = createBoard(gLevel.SIZE);
    renderBoard(gBoard, '.board-container');
}

function placeMines(numOfMines) {
    for (let i = 0; i < numOfMines; i++) {
        let posI = getRandomIntInclusive(0, gBoard.length - 1);
        let posJ = getRandomIntInclusive(0, gBoard[0].length - 1);
        let cell = gBoard[posI][posJ];

        if (cell.isMined || cell.isOpen) {
            i--;    //Already mined/opened? add a round and continue
            continue;
        } else {
            cell.isMined = true;
        }
    }
}

function negsMinesCount(cellPos) {
    let minesCount = 0;
    for (var i = cellPos.i - 1; i <= cellPos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellPos.j - 1; j <= cellPos.j + 1; j++) {
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
    if (!gGame.isOn) return;
    if (gOnProcces) return;
    if (gGame.secsPassed === 0 && gGame.shownCount === 0 && gGame.flaggedCount === 0) {
        //First click
        gTimerIvl = setInterval(startTimer, 1000);
    }
    var cell = gBoard[posI][posJ];
    if (!cell.isFlagged) {
        //Model
        cell.isFlagged = true;
        gGame.flaggedCount++;
        //DOM
        elCell.innerText = FLAG;
        //Check if user wins
        if (isUserWin()) onUserWin();
    } else {
        //Model
        cell.isFlagged = false;
        gGame.flaggedCount--;
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

function isUserWin() { //TO DO: change this check and use the gGame props.
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            let cell = gBoard[i][j];
            if (cell.isMined) {
                if (!cell.isFlagged) return false;
            } else {
                if (cell.isOpen) continue;
                return false;
            }
        }
    }
    return true;
}

function onUserWin() {
    let level = (gLevel.SIZE === 12) ? 'Hard' : (gLevel.SIZE === 8) ? 'Medium' : 'Easy';
    let bestScore = +localStorage.getItem(level)
    if (bestScore > gGame.secsPassed || !bestScore) localStorage.setItem(level, gGame.secsPassed);
    clearInterval(gTimerIvl);
    gGame.isOn = false;
    document.querySelector('.smiley').innerText = WIN;
}

function useHint() {
    if (!gGame.isOn || gOnProcces) return;
    gGame.hintMode = true;
}

function showNegsAndHide(posI, posJ) {
    gOnProcces = true;
    for (var i = posI - 1; i <= posI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = posJ - 1; j <= posJ + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;

            let cell = gBoard[i][j];
            let location = { i: i, j: j };
            let elCell = document.querySelector('.' + getClassName(location));

            if (cell.isOpen) continue;
            else if (cell.isMined) elCell.innerText = MINE;
            else if (!cell.minedNegsCount) elCell.innerText = cell.minedNegsCount
            else elCell.innerText = cell.minedNegsCount

            setTimeout(() => {
                elCell.innerText = (cell.isFlagged) ? FLAG : '';
                gGame.hintMode = false;
                gOnProcces = false;
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

    document.querySelector('.easy').innerText = easyBestScore;
    document.querySelector('.medium').innerText = mediumBestScore;
    document.querySelector('.hard').innerText = hardBestScore;
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
    let location = {i: i, j: j}
    let elSafeCell =  document.querySelector('.' + getClassName(location));
    gOnProcces = true;
    gGame.finds--;
    document.querySelector('.safe-click span').innerText = gGame.finds;
    elSafeCell.classList.add('reveal');
    setTimeout(() => {
        elSafeCell.classList.remove('reveal');
        gOnProcces = false;
    }, 1000);
}