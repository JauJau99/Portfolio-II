//#region CONSTANTS ------------------------------------------------------------------
const FPS = 1000 / 60;
const GAME_STATES = {
  IDLE: 0, 
  MENU: 1, 
  PLAY: 2, 
  GAMEOVER: 3
}

//#endregion

//#region Game variables -------------------------------------------------------------
const scene = document.getElementById("scene");
const brush = getBrush();

let currentGameState = GAME_STATES.IDLE;

//Score
let score = 0;
let higScore = 0
const INVADER_POINTS = 10;



// ------

const MENU = {
  currentIndex: 0,
  buttons: [
    { text: "Play", action: startPlay },
    { text: "High Scores", action: showHigScores }
  ]
}

// ------

const ship = {
  x: (scene.width * 0.5) - 50,
  y: scene.height - 30,
  width: 50,
  height: 20,
  velocityX: 0,
  velocityY: 0,
  maxVelocity: 3
}

// ------

const PROJECTILE = {
  width: 3,
  height: 5,
  speed: 2,
  cooldownTime: 40
}

let projectileCooldown = 0;
let projectiles = [];

// ------

const INVADERS = {
  width: 50,
  height: 20,
  padding: 20,
  startX: 50,
  startY: 20,
  speed: 1,
  direction: 1,
  enteties: []
}

const npcPerRow = Math.floor((scene.width - INVADERS.height) / (INVADERS.width + INVADERS.height));

// ------

// Movement back and forth of NPC´s are govered by counting up to a level
const maxMovementSteps = 50;
let movementSteps = maxMovementSteps;

// ------
// The following is a simple way of 
let controlKeys = {
  ArrowDown: false,
  ArrowUp: false,
  ArrowLeft: false,
  ArrowRight: false,
  " ": false, // space
}

window.addEventListener("keydown", function (e) {
  controlKeys[e.key] = true;
});

window.addEventListener("keyup", function (e) {
  controlKeys[e.key] = false;
})


//#endregion


//#region Game engine ----------------------------------------------------------------

function init() {

  let x = INVADERS.startX;
  let y = INVADERS.startY;
  for (let i = 0; i < npcPerRow; i++) {
    INVADERS.enteties.push({
      x,
      y,
      color: "Yellow",
      active: true,
      width: INVADERS.width,
      height: INVADERS.height,
      points: INVADER_POINTS
    });
    x += INVADERS.width + INVADERS.padding;
  }

  INVADERS.speed = 1;

  currentGameState = GAME_STATES.MENU;
  update();
}

function update(time) {

  if (currentGameState === GAME_STATES.MENU) {
    updateMenu(time);
  } else if (currentGameState === GAME_STATES.PLAY) {
    updateGame(time);
  }

  draw();
  requestAnimationFrame(update)
}

function draw() {
  clearScreen();

  if (currentGameState === GAME_STATES.MENU) {
    drawMenu();
  } else if (currentGameState === GAME_STATES.PLAY) {
    drawGameState();
  } else if (currentGameState=== GAME_STATES.GAMEOVER){
    drawGameOver();
  }

}

init(); // Starts the game

function drawGameOver(){
  brush.font = "40px serif";
  brush.fillText("GAME OVER", 100, 150);
  brush.font = "20px serif";
  brush.fillText("Trykk SPACE for meny", 100, 200);

  if (controlKeys[" "]) {
    currentGameState = GAME_STATES.MENU;
  }
}

//#endregion


//#region Game functions

function updateMenu(dt) {

  if (controlKeys[" "]) {
    MENU.buttons[MENU.currentIndex].action();
  }


  if (controlKeys.ArrowUp) {
    MENU.currentIndex--;
  } else if (controlKeys.ArrowDown) {
    MENU.currentIndex++;
  }

  MENU.currentIndex = clamp(MENU.currentIndex, 0, MENU.buttons.length - 1);


}

function drawMenu() {
  let sy = 100;
  for (let i = 0; i < MENU.buttons.length; i++) {


    let text = MENU.buttons[i].text;
    if (i == MENU.currentIndex) {
      text = `* ${text} *`
    }

    brush.font = "50px serif";
    brush.fillText(text, 100, sy);
    sy += 50;

  }
}

function updateGame(dt) {
  updateShip();
  updateProjectiles();
  updateInvaders();
  if (isGameOver()) {
    currentGameState = GAME_STATES.GAMEOVER;
  }
}

function updateInvaders() {

  let ty = 0;

  if (INVADERS.direction == 1 && movementSteps >= maxMovementSteps * 2) {
    movementSteps = 0;
    INVADERS.direction *= -1
  } else if (INVADERS.direction == -1 && movementSteps >= maxMovementSteps * 2) {
    movementSteps = 0;
    INVADERS.direction *= -1;
    ty += INVADERS.height;
  }

  let tx = INVADERS.speed * INVADERS.direction;

  for (let i = 0; i < npcPerRow; i++) {
    let invader = INVADERS.enteties[i];

    if (invader.active) {

      invader.x += tx;
      invader.y += ty;

      if (isShot(invader)) {
        invader.active = false;
      }

    }

  }

  movementSteps++;

}

function isGameOver() {
  for (let invader of INVADERS.enteties) {
    if (invader.active) {
      return false;
    }
  }

  return true;
}

function isShot(target) {

  for (let i = 0; i < projectiles.length; i++) {
    let projectile = projectiles[i];
    if (overlaps(target.x, target.y, target.width, target.height, projectile.x, projectile.y, projectile.width, projectile.height)) {
      projectile.active = false;

      if (target.points){
        score += target.points;
      }
      return true;
    }
  }

  return false;
}

function updateShip() {
  if (controlKeys.ArrowLeft) {
    ship.velocityX--;
  } else if (controlKeys.ArrowRight) {
    ship.velocityX++;
  }

  ship.velocityX = clamp(ship.velocityX, ship.maxVelocity * -1, ship.maxVelocity);

  let tmpX = ship.x + ship.velocityX;
  tmpX = clamp(tmpX, 0, scene.width - ship.width);

  ship.x = tmpX;

  projectileCooldown--;

  if (controlKeys[" "] && projectileCooldown <= 0) {
    projectiles.push({
      x: ship.x + ship.width * 0.5, 
      y: ship.y, 
      dir: -1, 
      active: true, 
      width: PROJECTILE.width, 
      height: PROJECTILE.height
    });
    projectileCooldown = PROJECTILE.cooldownTime;
  }
}

function updateProjectiles() {
  let activeProjectiles = []
  for (let i = 0; i < projectiles.length; i++) {
    let projectile = projectiles[i];
    projectile.y += PROJECTILE.speed * projectile.dir;
    if (projectile.y + projectile.height > 0 && projectile.active) {
      activeProjectiles.push(projectile);
    }
  }
  projectiles = activeProjectiles;
}

function drawGameState() {

  brush.fillStyle = "Black";
  brush.fillRect(ship.x, ship.y, ship.width, ship.height);

  for (let projectile of projectiles) {
    if (projectile.active) {
      brush.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    }
  }

  for (let i = 0; i < npcPerRow; i++) {
    let invader = INVADERS.enteties[i];
    if (invader.active) {
      brush.fillStyle = invader.color;
      brush.fillRect(invader.x, invader.y, INVADERS.width, INVADERS.height);
    }
  }

  //Score board
  brush.font = "20px serif";
  brush.fillStyle = "black";
  brush.fillText("Score: " + score, 10, 20);
}


function resetGame() {
  //Resett skipet
  ship.x = (scene.width * 0.5) - ship.width;
  ship.y = scene.height - 30;
  ship.velocityX = 0;
  ship.velocityY = 0;

  //Resett prosjektiler
  projectiles = [];
  projectileCooldown = 0;

  //Resett invaders
  INVADERS.enteties = [];
  INVADERS.speed = 1;
  INVADERS.direction = 1;

  let x = INVADERS.startX;
  let y = INVADERS.startY;
  for (let i = 0; i < npcPerRow; i++) {
    INVADERS.enteties.push({
      x,
      y,
      color: "Yellow",
      active: true,
      width: INVADERS.width,
      height: INVADERS.height,
      points: INVADER_POINTS
    });
    x += INVADERS.width + INVADERS.padding;
  }

  //Resett bevegelse til invaders
  movementSteps = maxMovementSteps;
}


function startPlay() {
  resetGame();
  currentGameState = GAME_STATES.PLAY;
}


function showHigScores() {

}

//#endregion

//#region Utility functions ----------------------------------------------------------

function getBrush() {
  return scene.getContext("2d");
}

function clearScreen() {
  if (brush) {
    brush.clearRect(0, 0, scene.width, scene.height);
  }
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}

function overlaps(x1, y1, w1, h1, x2, y2, w2, h2) {

  if (x1 + w1 < x2 || x2 + w2 < x1) {
    return false;
  }

  if (y1 + h1 < y2 || y2 + h2 < y1) {
    return false;
  }

  return true;
}
//#endregion
