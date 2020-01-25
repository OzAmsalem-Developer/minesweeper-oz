'use strict';

function renderBoard(board, selector) {
    let strHTML = '<table class="board" ><tbody>';
    for (let i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (let j = 0; j < board[0].length; j++) {
            let cell = board[i][j];
            let className = `cell cell${i}-${j}`;
            className += (gIsLightMode) ? ' cell-light' : ' cell-dark';
            if (cell.isOpen) className += ' clicked';
            strHTML += `<td onmouseover="onMouseOver(this, ${i},${j})" onmouseout="onMouseOut(this, ${i},${j})"                             oncontextmenu="cellFlagged(this, ${i} , ${j});return false;" 
            onclick="cellClicked(this, ${i} , ${j})" class="${className}">`;
            if (cell.isFlagged) strHTML += FLAG;
            if (cell.isOpen && cell.minedNegsCount) strHTML += cell.minedNegsCount;
            strHTML += '</td>';
        }
        strHTML += '</tr>';
    }
    strHTML += '</tbody></table>';
    let elContainer = document.querySelector(selector);
    elContainer.innerHTML = strHTML;
    setColors();
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createBoard(boardSize) {
    let board = [];
    for (let i = 0; i < boardSize; i++) {
        board[i] = [];
        for (let j = 0; j < boardSize; j++) {
            let cell = createCell();
            board[i][j] = cell;
        }

    }
    return board;
}

function getCellColor(cellContent) {
    switch (cellContent) {
        case 1:
            return 'blue';
        case 2:
            return 'green';
        case 3:
            return 'red';
        case 4:
            return 'orange';
        case 5:
            return 'orangered';
        case 6:
            return 'darkred';
        default: return 'purple';
    }
}

function setColors() {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard.length; j++) {
            let cell = (gBoard[i][j]);
            let elCell = document.querySelector('.' + getClassName({ i: i, j: j }));
            if (cell.isOpen && cell.minedNegsCount > 0) elCell.style.color = getCellColor(cell.minedNegsCount);
        }
    }
}

function startTimer() {
    gSecsPassed += 1;
    showTimer();
}

function showTimer() {
    let hours = parseInt(gSecsPassed / 3600);
    let minutes = parseInt((gSecsPassed - hours * 3600) / 60);
    let seconds = gSecsPassed - (hours * 3600 + minutes * 60);

    if (hours < 10) hours = '0' + hours;
    if (minutes < 10) minutes = '0' + minutes;
    if (seconds < 10) seconds = '0' + seconds;

    document.querySelector('.timer span').innerText = hours + ":" + minutes + ":" + seconds;
}

// Returns the class name for a specific cell
function getClassName(location) {
    let cellClass = 'cell' + location.i + '-' + location.j;
    return cellClass;
}

function countTimer() {
    var hour = Math.floor(totalSeconds / 3600);

}