'use strict';

function renderBoard(board, selector) {
    let strHTML = '<table class="board" border="1"><tbody>';
    for (let i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (let j = 0; j < board[0].length; j++) {
            let className = `cell cell${i}-${j}`;
            let cell = gBoard[i][j];
            strHTML += `<td oncontextmenu="cellFlagged(this, ${i} , ${j});return false;" onclick="cellClicked(this, ${i} , ${j})" class="${className}">`;
            // strHTML += (cell.isMined) ? MINE : cell.minedNegsCount;     //for debug
            strHTML += '</td>';
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>';
    let elContainer = document.querySelector(selector);
    elContainer.innerHTML = strHTML;
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
        default: return 'black';
    }
}

function startTimer() {
    gGame.secsPassed += 1;
    document.querySelector('.timer span').innerText = gGame.secsPassed;
}

// Returns the class name for a specific cell
function getClassName(location) {
    var cellClass = 'cell' + location.i + '-' + location.j;
    return cellClass;
}