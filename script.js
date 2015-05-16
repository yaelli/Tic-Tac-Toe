
var boardSize = 3;
var boardMin = 3;
var boardMax = 10;
var squares = [];
var player1 = true;
var computer = false;
var computerPlays = false;
var computerOptions;
var player1Name = 'Player1';
var player2Name = 'Player2';
var exIcon = '<i class="icon-remove"></i>';
var circleIcon = '<i class="icon-circle-blank"></i>';

document.addEventListener('DOMContentLoaded', function(){
    var selectBox = document.getElementById('gameSize');
    for (var i = boardMin; i<=boardMax; i++){
        selectBox.options[i-boardMin] = new Option(i, i);
    }
});

function selectSize(){
    boardSize = document.getElementById('gameSize').value;
}

function startGame(mode){
    if (mode=='computer'){
        computer = true;
        player2Name = 'Computer';
    }
    else{
        computer = false;
        player2Name = 'Player2';
    }
    initGame();
}

function initGame(){
    squares = [];
    player1 = true;
    computerPlays = false;
    computerOptions = {
        block: {
            row: [],
            col: [],
            diagonal1: [],
            diagonal2: []
        },
        win: {
            row: [],
            col: [],
            diagonal1: [],
            diagonal2: []
        }
    };
    var boardContainer = document.getElementById('game'),
        board= '';
    for (var i=0; i<boardSize; i++){
        squares[i] = [];
        board += '<div class="row">';
        for (var j=0; j<boardSize; j++){
            var buttonClass = '';
            if (i==0){
                buttonClass += 'top';
            }
            else if (i==boardSize-1){
                buttonClass += 'bottom';
            }
            if (j == 0){
                buttonClass += ' left';
            }
            else if (j == boardSize-1){
                buttonClass += ' right';
            }
            board += '<button class="'+buttonClass+'" id="square-'+i+'-'+j+'" data-row="'+i+'" data-col="'+j+'" onclick="squareClicked(event)"></button>';
        }
        board += '</div>';
    }
    boardContainer.innerHTML = board;
}

// user clicked a square event
function squareClicked(e){
    if (computerPlays) return;
    var button = e.target,
        i = parseInt(button.dataset.row),
        j = parseInt(button.dataset.col);
    console.log("player: "+i+", "+j);
    if (squares[i][j] == undefined){
        if (player1){
            squares[i][j] = 'x';
            button.innerHTML = exIcon;
        }
        else {
            squares[i][j] = 'o';
            button.innerHTML = circleIcon;
        }
        checkGame(i, j);
    }
}

// check if the game is over and move turns
function checkGame(row, col){
    var icon = squares[row][col];
    var horizontal = true;
    var vertical = true;
    var diagonal1 = true;
    var diagonal2 = true;
    for (var i=0; i<boardSize; i++){
        if (squares[i][col] != icon) horizontal=false;
        if (squares[row][i] != icon) vertical=false;
        if (squares[i][i] != icon) diagonal1=false;
        if (squares[i][boardSize-i-1] != icon) diagonal2=false;
    }
    if (horizontal||vertical||diagonal1||diagonal2) gameOver();
    // check if there's no option left for winning
    else if (blockedRows() && blockedCols() && blockedDiagonals()){
        alert('eh, You Suck.');
        initGame();
    }
    else {
        rememberChoice(row, col);
        player1 = !player1;
        if (!player1 && computer) {
            computerPlays = true;
            setTimeout(computerTurn, 700);
        }
    }
}

// gets a player choice and check if it considers a win/block strategy
function rememberChoice(row, col){
    // determine if this square needs to be blocked
    // or can be used to win
    var strategy,
        reverse;
    if(player1){
        strategy = 'block';
        reverse = 'win';
    }
    else{
        strategy = 'win';
        reverse = 'block';
    }
    var blockedRow = blocked('row', row),
        blockedCol = blocked('col', row, col);
    computerOptions[reverse].row[row] = false;
    computerOptions[strategy].row[row] = !blockedRow;
    computerOptions[reverse].col[col] = false;
    computerOptions[strategy].col[col] = !blockedCol;
    // if this square is in diagonal1
    if (row == col){
        var blockedDiagonal1 = blocked('diagonal1', row);
        computerOptions[reverse].diagonal1[0] = false;
        computerOptions[strategy].diagonal1[0] = !blockedDiagonal1;
    }
    // if this square is in diagonal2
    if (row == boardSize - col - 1){
        var blockedDiagonal2 = blocked('diagonal2', row);
        computerOptions[reverse].diagonal2[0] = false;
        computerOptions[strategy].diagonal2[0] = !blockedDiagonal2;
    }
}

// player2 plays automatically
function computerTurn(){
    var choice = selectSquare();
    squares[choice.row][choice.col] = 'o';
    var button = document.getElementById('square-'+choice.row+'-'+choice.col);
    button.innerHTML = circleIcon;
    computerPlays = false;
    console.log('computer: '+choice.row+', '+choice.col);
    checkGame(choice.row, choice.col);
}

// logic for the computer turn
function selectSquare(){
    var blockOptions = getOptions('block'),
        winOptions = getOptions('win'),
        bestOptions = [];
    if (winOptions.critical){
        bestOptions = winOptions.options;
    }
    else if (blockOptions.critical){
        bestOptions = blockOptions.options;
    }
    else {
        bestOptions = winOptions.options.concat(blockOptions.options);
    }
    if (bestOptions.length>0){
        console.log('bestOptions');
        var index = getRandom(0, bestOptions.length-1);
        return bestOptions[index];
    }
    else{
        console.log('random');
        return selectRandom();
    }
}

// go over the saved options and create and array of the possible locations
function getOptions(strategy){
    var options = [],
        critical = [];
    var key;
    for (key in computerOptions[strategy]) {
        var line = computerOptions[strategy][key];
        for (var i=0; i<line.length; i++){
            if (!line[i]) continue;
            var tempOptions = getLineOptions(key, i);
            if (tempOptions.length<2){
                critical = critical.concat(tempOptions);
            }
            options = options.concat(tempOptions);
        }
    }
    return {options: ((critical.length > 0) ? critical : options), critical: (critical.length > 0)};
}

// get options from a specific line
function getLineOptions(line, index){
    var tempOptions = [];
    for (var j=0; j<boardSize; j++){
        var row, col;
        switch(line) {
            case "row":
                row = index;
                col = j;
                break;
            case "col":
                row = j;
                col = index;
                break;
            case "diagonal1":
                row = j;
                col = j;
                break;
            case "diagonal2":
                row = j;
                col = boardSize-j-1;
                break;
        }
        if (squares[row][col]==undefined){
            tempOptions.push({row:row, col:col});
        }
    }
    return tempOptions;
}

// check if a line is blocked
function blocked(direction, row, col){
    var lineBlocked = false,
        square,
        lineIcon;
    for (var i=0; i<boardSize; i++) {
        switch(direction) {
            case 'row':
                square = squares[row][i];
                break;
            case 'col':
                square = squares[i][col];
                break;
            case 'diagonal1':
                square = squares[i][i];
                break;
            case 'diagonal2':
                square = squares[i][boardSize-i-1];
                break;
        }
        if (square != undefined) {
            if (lineIcon == undefined){
                lineIcon = square;
            }
            else if (square != lineIcon){
                lineBlocked = true;
            }
        }
    }
    return lineBlocked;
}

// random select
function selectRandom(){
    var i = getRandom(0, boardSize-1);
    var j = getRandom(0, boardSize-1);
    if (squares[i][j] != undefined) return selectRandom();
    else return {row:i, col:j};
}

function getRandom(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

// check if all rows are blocked
function blockedRows(){
    for (var i=0; i<boardSize; i++){
        var lineIcon,
            blockedLine = false;
        for (var j=0; j<boardSize; j++){
            if (squares[i][j] != undefined) {
                if (lineIcon != undefined && lineIcon != squares[i][j]){
                    blockedLine = true;
                }
                else{
                    lineIcon = squares[i][j];
                }
            }
        }
        if (!blockedLine){
            return false;
        }
    }
    return true;
}

// check if all columns are blocked
function blockedCols(){
    var blockedCol = [],
        colIcon = [];
    for (var i=0; i<boardSize; i++){
        blockedCol[i] = false;
    }
    for (var i=0; i<boardSize; i++){
        for (var j=0; j<boardSize; j++){
            if (squares[i][j] != undefined) {
                if (colIcon[j] != undefined && colIcon[j] != squares[i][j]){
                    blockedCol[j] = true;
                }
                else{
                    colIcon[j] = squares[i][j];
                }
            }
        }
    }
    for (var j=0; j<boardSize; j++){
        if (!blockedCol[j]){
            return false;
        }
    }
    return true;
}

// check if both diagonals are blocked
function blockedDiagonals(){
    var diagonalIcon1,
        diagonalIcon2,
        blockedDiagonal1 = false,
        blockedDiagonal2 = false;
    for (var i=0; i<boardSize; i++){
        if (squares[i][i] != undefined && !blockedDiagonal1) {
            if (diagonalIcon1 != undefined && diagonalIcon1 != squares[i][i]){
                blockedDiagonal1 = true;
            }
            else{
                diagonalIcon1 = squares[i][i];
            }
        }
        if (squares[i][boardSize - i - 1] != undefined && !blockedDiagonal2) {
            if (diagonalIcon2 != undefined && diagonalIcon2 != squares[i][boardSize - i - 1]){
                blockedDiagonal2 = true;
            }
            else{
                diagonalIcon2 = squares[i][boardSize - i - 1];
            }
        }
    }
    if (!blockedDiagonal1||!blockedDiagonal2){
        return false;
    }
    return true;
}

/**
 * runs if one of the players wins the game
 * alert the winner and clears board
 */
function gameOver(){
    var player = player1 ? player1Name : player2Name;
    alert (player + " Won!");
    initGame();
}
