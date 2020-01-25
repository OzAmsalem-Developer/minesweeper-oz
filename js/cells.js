'use strict';

function cellClicked(elCell, posI, posJ) {
    if (!gIsGameOn) return;
    if (gOnProcces) return;

    if (gGame.hintMode) {
        if (gGame.shownCount === 0 && !gGame.isManualMode) {
            gGame.hintMode = false;
            return; //Not available on first click
        }
        showNegsAndHide(posI, posJ);
        gGame.hintsCount--;
        saveStep();
        handleNegsOnHint(posI, posJ, true)
        document.querySelector('.hint span').innerText = gGame.hintsCount;
        gGame.hintMode = false;
        return;
    }

    let cell = gBoard[posI][posJ];

    if (gGame.isManualMode) {
        if (gMinesToPlace < gLevel.MINES) { //User is placing mines
            if (cell.isMined) return; //If try to place twice on the same cell
            cell.isMined = true;
            elCell.classList.add('mine-placed');
            setTimeout(() => { //Indicate to the user that mine is placed
                elCell.classList.remove('mine-placed');
            }, 650);
            if (gMinesToPlace === gLevel.MINES - 1) {
                // Last mine to place, the game start after.
                minedNegsCountForEveryone();
                saveStep();
                setTimeout(() => {
                    
                    alert('Start Play the Game');
                }, 720);
            }
            gMinesToPlace++;
            return;
        }
    }

    if (cell.isFlagged || cell.isOpen) return;

    if (cell.isMined) {
        //On manual mode, first click could be a mine! so start timer if so
        if (gGame.isManualMode && gSecsPassed === 0 &&
            gGame.shownCount === 0 && gGame.flaggedCount === 0) gTimerIvl = setInterval(startTimer, 1000);

        if (gGame.lives) {
            steppedOnMine(elCell);
            saveStep();
            return;
        } else {
            elCell.innerText = MINE;
            //In the state of game over, nothing changes in the model in order to enable UNDO
            gameOver();
            saveStep();
            return;
        }
    }

    if (cell.minedNegsCount > 0) {
        //On manual mode, first click could be a number! so start timer if so
        if (gGame.isManualMode && gSecsPassed === 0 &&
            gGame.shownCount === 0 && gGame.flaggedCount === 0) gTimerIvl = setInterval(startTimer, 1000);
        //Model
        cell.isOpen = true;
        gGame.shownCount++;
        saveStep();
        //DOM
        elCell.innerText = cell.minedNegsCount;
        elCell.style.color = getCellColor(cell.minedNegsCount);
        elCell.classList.add('clicked');
    } else { //Empty cell found
        // First num play-click on both modes 
        //(manual mode can be this or this, first on regular must be empty)
        if (gSecsPassed === 0 && gGame.shownCount === 0 && gGame.flaggedCount === 0) {
            //Start timer:
            gTimerIvl = setInterval(startTimer, 1000);
            if (!gGame.isManualMode) {
                //And only if it's regular mode, place mines:
                placeMines(gLevel.MINES, { i: posI, j: posJ });
                minedNegsCountForEveryone();
                saveStep();
            }
        }
        //Model
        cell.isOpen = true;
        gGame.shownCount++;
        //DOM
        elCell.style.color = getCellColor(cell.minedNegsCount);
        elCell.innerText = (cell.minedNegsCount) ? cell.minedNegsCount : '';
        elCell.classList.add('clicked');
        //Handle empty cells:
        let location = { i: posI, j: posJ };

        checkAndShowNegs(location);
        saveStep();
    }
    if (isUserWin()) onUserWin();
}

function checkAndShowNegs(cellPos) {
    for (let i = cellPos.i - 1; i <= cellPos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (let j = cellPos.j - 1; j <= cellPos.j + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            if (i === cellPos.i && j === cellPos.j) continue;

            let cell = gBoard[i][j];
            if (cell.isMined || cell.isOpen || cell.isFlagged) continue;
            let location = { i: i, j: j };
            let elCell = document.querySelector('.' + getClassName(location));
            //Model
            cell.isOpen = true;
            gGame.shownCount++;
            elCell.classList.add('clicked');
            if (cell.minedNegsCount > 0) {
                //DOM
                elCell.innerText = cell.minedNegsCount;
                elCell.style.color = getCellColor(cell.minedNegsCount);
            } else {
                //Found 0? recurse:
                checkAndShowNegs(location);
            }
        }
    }
}

function createCell() {
    let cell = {
        isOpen: false,
        isMined: false,
        isFlagged: false,
        minedNegsCount: 0
    }
    return cell;
}