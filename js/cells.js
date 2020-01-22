'use strict';

function cellClicked(elCell, posI, posJ) {
    if (!gGame.isOn) return;
    if (gOnProcces) return;


    let cell = gBoard[posI][posJ];
    
    if (gGame.hintMode) {    //TO DO: render the DOM with num of hints
        if (!gGame.hintsCount) {
            alert('You have no more hints');
            gGame.hintMode = false;
            return;
        }
        showNegsAndHide(posI, posJ);
        gGame.hintsCount--;
        return;
    }

    if (cell.isFlagged || cell.isOpen) return;

    if (cell.isMined) {
        if(gGame.lives) {
            steppedOnMine(elCell);
            return;
        } else {
            elCell.innerText = MINE;
            gGame.shownCount++;
            cell.isOpen = true;
            gameOver();
            return;
        }
    }

    if (cell.minedNegsCount > 0) {
        //Model
        cell.isOpen = true;
        gGame.shownCount++;
        //DOM
        elCell.innerText = cell.minedNegsCount;
        elCell.style.color = getCellColor(cell.minedNegsCount);
    } else {
        //Model
        cell.isOpen = true;
        gGame.shownCount++;
        //DOM
        elCell.innerText = cell.minedNegsCount;

        //First click:
        //Change this if and fix the first 0 issue.
        if (gGame.secsPassed === 0 && gGame.shownCount === 1 && gGame.flaggedCount === 0) { 
            //Place Mines:
            placeMines(gLevel.MINES);
            minedNegsCountForEveryone();
            //Start timer:
            gTimerIvl = setInterval(startTimer, 1000);
        }
        //Handle empty cells:
        let location = { i: posI, j: posJ };
        // 1.check negs
        // 2.if not-opened number found, show it
        // 3.if empty cell found, open and recurse
        checkAndShowNegs(location);
    }
    if (isUserWin()) onUserWin();
}

function checkAndShowNegs(cellPos) {
    for (var i = cellPos.i - 1; i <= cellPos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellPos.j - 1; j <= cellPos.j + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            if (i === cellPos.i && j === cellPos.j) continue;

            let cell = gBoard[i][j];
            if (cell.isMined || cell.isOpen || cell.isFlagged) continue;
            let location = { i: i, j: j };
            let elCell = document.querySelector('.' + getClassName(location));

            //Could short the code but wait to done with the emojies etc...
            if (cell.minedNegsCount > 0) {
                //Model
                cell.isOpen = true;
                gGame.shownCount++;
                //DOM
                elCell.innerText = cell.minedNegsCount;
                elCell.style.color = getCellColor(cell.minedNegsCount);
            } else {
                //Model
                cell.isOpen = true;
                gGame.shownCount++;
                //DOM
                elCell.innerText = cell.minedNegsCount;
                //Found 0? recurse:
                checkAndShowNegs(location);
            }
        }
    }
}

function createCell(posI, posJ) {
    let cell = {
        isOpen: false,
        isMined: false,
        isFlagged: false,
        minedNegsCount: 0
    }
    return cell;
}