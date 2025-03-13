
const cells = document.querySelectorAll('.cell');// used for cells in the board 
const text = document.getElementById('status');// used to display game status belows the game board
const restart = document.getElementById('restart');// used for the restart button
const menu = document.getElementById('start');// start menu that conmtains ai first, ai vs ai simulation and human first button
const human = document.getElementById('human-first');// human first b utton
const ai = document.getElementById('ai-first');// ai first button
const s = document.getElementById('simulate');// ai vs ai simulation button
const board = document.getElementById('board');// game board
const Gresult = document.getElementById('game-result');// game result
let state = new Array(42).fill("");// fill 42 cells of array with empty string 
let game=true;// whether game is still active or not 
let player;// to assign player
const Thuman='X';// X symbol for human player
const Tai='O';// O symbol for ai player
const winning=[];// winning cell index combinations  array
// for horizontal wins
for(row=0;row<=5;row++)
{
  for(column=0;column<=3;column++)
  {
    winning.push([row*7 +column, row*7 +(column+1),row*7 +(column+2),row*7 +(column+3)]);
  }
}
// for vertical wins
for(column=0;column<=6;column++)
{
  for(row=0;row<=2;row++)
  {
    winning.push([(row)*7 +column,(row+1)*7 +column,(row+2)*7 +column,(row+3)*7 +column]);
  }
}
// for diagnol wins left to upward
for (let r=0;r<=2;r++) {
  for (let c=0;c<=3;c++) {
    winning.push([
      r*7 + c,(r + 1)*7 + (c+1), (r + 2)*7 + (c+2), (r + 3)*7 + (c+3)
    ]);
  }
}
// for diagnol wins left to downward
for (let r=3;r<=5;r++) {
  for (let c=0;c<=3;c++) {
    winning.push([
      r*7 + c,(r-1)*7 + (c+1),(r-2)*7 + (c+2), (r-3)*7 + (c+3)
    ]);
  }
}
// to display winning message
function wmessage(player) {
  return player + " has won!!";
}
// to display draw message

function dmessage() {
 return `Game draw!`;
}
// to display current turn using if and else statement
function currenturn() {
  if (player === Thuman) {
       return "It's your turn";
  } 
  else { return "It's AI's turn";}
}
// helper function to get available moves using nested loop which search from bottom of each column and  breaks when it finds empty string pushing the index in moves array
function available(A) {
  let moves = [];
  for (column=0;column<=6;column++) {
    for (let row = 5; row >= 0; row--) {
      let index = row * 7 + column;
      if (A[index] === "") {
        moves.push(index);
        break;  
      }
    }
  }
  return moves;
}
// to get the  result of the game by getting winner symbol by checking the winning array by running a for loop or if its draw and returning the result
function result1(A) {
  for (let i = 0;i < winning.length;i++) {
    let condition=winning[i];
    const [a, b, c, d] = condition;
    if (A[a] !== "" && A[a] === A[b] && A[a] === A[c] && A[a] === A[d] ) {
      return A[a];
    }
  }
  if (A.includes("")) {
    return null; 
  }
  return "Draw"; 
}
// for game play to get available moves using getm , apply moves given the move and the state by creating copy game state and applying the move and changing playhistory without changing orignal array , get the winner, and return new game state after applying move to old one and get winjner and current player
const C4 = {
  getm: function(B) {return available(B.board);},
  applym: function(B,move) {
    let newB = B.board.slice();
    newB[move] = B.player;
    let newPlayer;
    if (B.player === Thuman) 
    {newPlayer = Tai;}
     else {newPlayer = Thuman;}
    return {board: newB, player: newPlayer, playHistory: B.playHistory.concat(move)}},
  getw: function(B) {return result1(B.board);},
  getp: function(B) {return B.player;}
};
// to check whether the give node is leaf means it does not have any children or is fully expanded or full expanded for the given node 
class MC {
  constructor(parent,move,state,legalmoves) {
    this.parent = parent;
    this.move = move;
    this.state = state;
    this.visits = 0;
    this.wins = 0;
    this.children = {};
    this.legalmoves = legalmoves;
  }
  fullexpand() {
    return this.legalmoves.length === 0;
  }
  leaf() {
    return Object.keys(this.children).length === 0 && this.legalmoves.length === 0;
  }
}
// Mcts class which performs selection , expansion , simulation and backpropagation in a tree 
class Mct {
  // takes in the game object for game logic  and constant valued 2 for uct formula and the root node
  constructor(game,e=2) {
    this.game = game;
    this.e = e;
    this.root = null;
  }
  /*this creates a root node using mc class by intializes current game state and getting available moves from c4 constant and then it is run through given iterations 
  to get the best child until it reaches the leaf node or fully expanded node once it reahces there a new node n is expanded using expand then simulate using simulate function 
  and backpropagate using backpropagate function*/
  search(state,iterations=1000) {
    this.root = new MC(null, null, state,this.game.getm(state));
    for (let i = 0;i<=iterations;i++) {
      let n = this.root;
      while (!n.leaf() && n.fullexpand()) {
        n=this.bestchild(n);
      }
      if (!n.fullexpand() && this.game.getw(n.state) === null) {
        n=this.expand(n);
      }
      const winner = this.simulate(n.state);
      this.backpropagate(n, winner);
    }
  }
/* this is used to get the best child for give node  which here in n , initial score is large negative value and then the array of keys for n childrens is taken in the for loop which check 
score of every child using uct formula  and score is updated in for loop to get child with best score which is selected */
  bestchild(n) {
    let score1 = -10000000;
    let child1;
    const keys = Object.keys(n.children); 
for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const child = n.children[key];
      const score = child.wins / child.visits + Math.sqrt(this.e * Math.log(n.visits) / child.visits);
      if (score > score1) {
        score1 = score;
        child1 = child;
      }
    }
    return child1;
  }
/* it pops out the move from the legal moves to apply it to the current game state which makes a newstate then a new node is created using mc class givng n as parent,
move popped out as move , new state as the game state and updated legal moves for new state , then new node is stored in n's children with key used is the move popped out
new node is returned */ 
  expand(n){
    const move = n.legalmoves.pop();
    const newstate = this.game.applym(n.state, move);
    const legalmoves = this.game.getm(newstate);
    const newnode = new MC(n, move, newstate, legalmoves);
    n.children[JSON.stringify(move)] = newnode;
    return newnode;
  }
/* it creates copy of current state properties so that original state remains unchanged then a while loop is used with base case returning the winner once 
if any , then a random move is slected from available moves and is applied to game state until there is result*/
  simulate(state) {
    let currentstate = {...state};
    while (true) {
      const winner = this.game.getw(currentstate);
      if (winner !== null) return winner;
      const moves = this.game.getm(currentstate);
      const randomove = moves[Math.floor(Math.random() * moves.length)];
      currentstate = this.game.applym(currentstate, randomove);
    }
  }
/* this a while loop starts from leaf node and is traversed back until root node is reached and increases the win count if its not draw and the current player didnt win because when getm is applied in 
in simulate it switches the player*/
  backpropagate(node, winner) {
    while (node !== null) {
      node.visits++;
      if (winner !== 'draw' && this.game.getp(node.state) !== winner) {
        node.wins++;
      }
      node = node.parent;
    }
  }
/* to find the best move from the root node the keys for roots children is taken out using that a for loop is run to to find best visit and best move from the available key
and the child with most visits is returned as best move */
  getmoves() {
    let bestm = null;
    let visit = -10000;
const keys = Object.keys(this.root.children); 
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const child = this.root.children[key];
      if (child.visits > visit) {
        visit = child.visits;
        bestm = child.move;
      }
    }
    return bestm;
  }
}

human.addEventListener('click', () => startGame(Thuman));
ai.addEventListener('click', () => startGame(Tai));
s.addEventListener('click', () => simulateGames1());
/* when a game is started it hides the start menu because it is no longer needed and unhides restart button and status text, and sets game to active with filling board with empty strings
and if its ai player turn it calls ai move with a timeout to make ai move*/
function startGame(firstplayer) {
  player = firstplayer;
  menu.classList.add('hidden');
  restart.classList.remove('hidden');
  text.classList.remove('hidden');
  Gresult.classList.add('hidden');
  board.classList.remove('hidden');
  game = true;
  state = new Array(42).fill("");
  cells.forEach(cell => cell.innerHTML = "");
  text.innerHTML = currenturn();
  if (player === Tai) {
    setTimeout(aiMove, 500);
  }
}
/* when a game is restarted it unhides the start menu  needed to select who goes first  and hides restart button and status text because it is no longer needed, and sets game to active with filling board with empty strings
*/
restart.addEventListener('click', () => {
  state = new Array(42).fill("");
  game = true;
  cells.forEach(cell => cell.innerHTML = "");
  menu.classList.remove('hidden');
  board.classList.add('hidden');
  restart.classList.add('hidden');
  text.classList.add('hidden');
  Gresult.classList.add('hidden');
  s.classList.remove('hidden');

});
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
/* to place the the symbol in the board we first find the index clicked and then take modulus of index to find the column and then
using for loop place the symbol at lowest available column if row is not valid or its ai turn or game is not active
return then switch the player and make ai move*/ 
function handleCellClick(event) {
  const clickedCell = event.target;
  const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));
  const column = clickedCellIndex % 7;
  let place = -1;
  for (let row = 5; row >= 0; row--) {
    let index = row * 7 + column;
    if (state[index] === "") {
      place = index;
      break;
    }
  }
  if (place === -1 || !game || player !== Thuman) return;
  state[place] = Thuman;
  document.querySelector(`.cell[data-index="${place}"]`).innerHTML = Thuman;
  if (quit(Thuman)) return;
  player = Tai;
  text.innerHTML = currenturn();
  setTimeout(aiMove, 500);
}
/* this makes ai move by first checking if game is active or not . then it creates a state object that copies current gmae state 
and set current player to ai with emopty play history then creates a instance for mct giving c4 as game logic
it calls sarch function for mcts that run 500 simulations and then get best best move after simulation and 
place it on board in the end switching player */
function aiMove() {
  if (!game) return;
  let stateObj = { board: state.slice(), player: Tai, playHistory: [] };
  const mcts = new Mct(C4, 2);
  mcts.search(stateObj, 500); 
  const bestMove = mcts.getmoves();
  if (bestMove === undefined) return;
  state[bestMove] = Tai;
  document.querySelector(`.cell[data-index="${bestMove}"]`).innerHTML = Tai;
  if (quit(Tai)) return;
  player = Thuman;
  text.innerHTML = currenturn();
}
// checks if the given player won and then update the game active to false giving draw message and then check if game is draw or not and give draw message if true
function quit(player) {
  let x = false;
  for (let i = 0;i < winning.length;i++) {
    let condition=winning[i];
    const [a, b, c, d] = condition;
    if (
      state[a] !== "" &&state[a] === state[b] &&  state[a] === state[c] &&  state[a] === state[d] ) {
      x = true;
      break;
    }
  }
  if (x) {
    text.innerHTML = "";
    Gresult.classList.remove('hidden');
    Gresult.innerHTML = wmessage(player);
    game = false;
    return true;
  }
  if (!state.includes("")) {
    text.innerHTML = "";
    text.classList.remove('hidden');
    text.innerHTML = dmessage();
    game = false;
    return true;
  }
  return false;
}

/* to simulate ai vs ai on the board  play game funnction is called recursively until there is no result then a mcts instance is created that makes best moves and switches the player after 
every move with a timeout so that moves can be seen */
function simulateGames1() {
  s.classList.add('hidden');
menu.classList.add('hidden');
 


  function playGame(i) {
    let currentPlayer;
  
      currentPlayer = "X";
    
    let state = { board: new Array(42).fill(""), player: currentPlayer, playHistory: [] };

    function makeMove() {
      let result = result1(state.board);
      if (result !== null) {
        Gresult.classList.remove('hidden');
        if (result === "Draw") {
          Gresult.innerHTML = "Draw!"; 
        } else {
          Gresult.innerHTML = wmessage(result); 
        }
        restart.classList.remove('hidden');
        return;
      }
      const mcts = new Mct(C4, 2);
      mcts.search(state, 1000); 

      const move = mcts.getmoves();
      state = C4.applym(state, move); 

   
      let cell = document.querySelector(`.cell[data-index="${move}"]`);
      if (cell) {
        cell.innerHTML = currentPlayer;
      }

      if (currentPlayer === "X") {
        currentPlayer = "O";
      } else {
        currentPlayer = "X";
      }
      state.player = currentPlayer;

      setTimeout(makeMove, 500);
    }
    makeMove();
  }
    playGame(); 
}
/* create constant result to keep count of stats then the given number of games are played with using for loop that keep on playing game until a result and then update the result
 in last console log is sent to give the win rate loss rate and draw rate*/
function simulate1000(n) {
  const results = {
    X: 0,
    O: 0,
    Draw: 0
  };
  
  for (let i = 0; i < 1000; i++) {
    let startingPlayer;
    
      startingPlayer = Thuman;
    
        let state = { board: new Array(42).fill(""), player: startingPlayer, playHistory: [] };
    
  
    while (result1(state.board) === null) {
      const mcts = new Mct(C4, 2);
      mcts.search(state, n); 

      const move = mcts.getmoves();
      state = C4.applym(state, move); 
    } 
    let result = result1(state.board);
    results[result] = results[result] + 1;
  }
  
  console.log(`After 1000 games:`);
  console.log(`X wins: ${(results["X"] / 1000 * 100).toFixed(2)}%`);
  console.log(`O wins: ${(results["O"] / 1000 * 100).toFixed(2)}%`);
  console.log(`Draws: ${(results["Draw"] / 1000 * 100).toFixed(2)}%`);
}





//simulate1000(500);
