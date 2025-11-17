//============= KONSTANTER og GLOBALE VARIABLER========


// ---- Game state ----
const GAME_STATES = {
  IDLE: 0, 
  MENU: 1, 
  PLAY: 2, 
  GAMEOVER: 3
};


// ---- Canvas / Drawing ----
const scene = document.getElementById("scene");
const brush = getBrush();


//---- Scoring ----
let score = 0;
let highScore = 0;
const INVADER_POINTS = 10;
let showingHighScore = false;


//---- Invader setup ----
const INVADER_ROWS = 4;
const INVADER_ROW_SPACING = 10;
const INVADER_COLORS = ["Yellow", "Green", "Orange", "Red"];

const INVADERS = {
  width: 50,
  height: 20,
  padding: 20,
  startX: 50,
  startY: 20,
  speed: 1,
  direction: 1,
  entities: []
};

const npcPerRow = Math.floor((scene.width - INVADERS.height) / (INVADERS.width + INVADERS.height));


// Invader movement (Hvor mange steg invaders går før de snur)
const maxMovementSteps = 50;
let movementSteps = maxMovementSteps;


//---- UFO ----
const UFO = {
  active: false,
  x: 0,
  y: 40,
  width: 40,
  height: 20,
  speed: 2,
  points: 100
};

let ufoSpawnTimer = 0;


// ---- player ship ----
const ship = {
  x: (scene.width * 0.5) - 50,
  y: scene.height - 30,
  width: 50,
  height: 20,
  velocityX: 0,
  velocityY: 0,
  maxVelocity: 3
};


// ---- Projectiles ----
const PROJECTILE = {
  width: 3,
  height: 5,
  speed: 2,
  cooldownTime: 40
};

let projectileCooldown = 0;
let projectiles = [];


// ---- Menu ----
const MENU = {
  currentIndex: 0,
  buttons: [
    { text: "Play", action: startPlay },
    { text: "High Scores", action: showHigScores }
  ]
};


// ---- Input state ----
let controlKeys = {
  ArrowDown: false,
  ArrowUp: false,
  ArrowLeft: false,
  ArrowRight: false,
  " ": false, // space
};


// ---- Current game state ----
let currentGameState = GAME_STATES.IDLE;


// ---- Keyboard listeners ----
window.addEventListener("keydown", function (e) {
  controlKeys[e.key] = true;
});

window.addEventListener("keyup", function (e) {
  controlKeys[e.key] = false;
});


//============= GAME ENGINE ===========================


function init() {
  INVADERS.entities = [];

  for (let row = 0; row < INVADER_ROWS; row++){
    let y = INVADERS.startY + row * (INVADERS.height + INVADER_ROW_SPACING);
    let x = INVADERS.startX;
    let color = INVADER_COLORS[row % INVADER_COLORS.length];

    for (let col = 0; col < npcPerRow; col++){
      INVADERS.entities.push({
      x,
      y,
      color,
      active: true,
      width: INVADERS.width,
      height: INVADERS.height,
      points: INVADER_POINTS
      });

      x += INVADERS.width + INVADERS.padding;
    }
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

function drawGameOver(){
  brush.font = "40px serif";
  brush.fillText("GAME OVER", 100, 150);

  brush.font = "24px serif";
  brush.fillText("Score : " + score, 100, 200);
  brush.fillText("High score: " + highScore, 100, 230);

  brush.font = "20px serif";
  brush.fillText("Trykk m for å gå til meny", 100, 270);

  if (controlKeys["m"] || controlKeys["M"]){
    currentGameState = GAME_STATES.MENU;
  }
}

init(); // Starts the game


//============= GAME LOGIC ============================


// ---- Meny ----
function updateMenu(dt) {
  if (showingHighScore){
    if (controlKeys["m"] || controlKeys["M"]){
      showingHighScore = false;
    }
  return;
  }

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
  if (showingHighScore) {
    brush.font = "40px serif";
    brush.fillText("High Score", 100, 120);

    brush.font = "30px serif";
    brush.fillText(highScore.toString(), 100, 170);

    brush.font = "20px serif";
    brush.fillText("Trykk M for å gå tilbake", 100, 220);
    return;
  }

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

function startPlay() {
  resetGame();
  currentGameState = GAME_STATES.PLAY;
}

function showHigScores() {
  showingHighScore = true;
}


// ---- Gameplay ----
function updateGame(dt) {
  updateShip();
  updateProjectiles();
  updateInvaders();
  updateUfo();

  if (isGameOver()) {
    if (score > highScore){
      highScore = score;
    }
    currentGameState = GAME_STATES.GAMEOVER;
  } else if (areAllInvadersDestroyed()){
    startNewWave();
  }
}

function isGameOver() {
  for (let invader of INVADERS.entities) {
    if (invader.active && invader.y + invader.height >= ship.y){
      return true;
    }
  }

  return false;
}

function areAllInvadersDestroyed(){
  for (let invader of INVADERS.entities){
    if(invader.active){
      return false;
    }
  }
  return true;
}

// ---- Invaders movement ----
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

  for (let invader of INVADERS.entities) {
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

// ---- UFO ----
function updateUfo() {
  if (!UFO.active) {
    ufoSpawnTimer--;
    if (ufoSpawnTimer <= 0) {
      UFO.active = true;
      UFO.x = -UFO.width; // start utenfor venstre kant
    }
  } else {
    // Beveg UFOen
    UFO.x += UFO.speed;

    // Sjekk om UFO blir truffet
    if (isShot(UFO)) {
      UFO.active = false;
      ufoSpawnTimer = getRandomUfoSpawnTime();
    } else if (UFO.x > scene.width) {
      // Fløy ut av skjermen
      UFO.active = false;
      ufoSpawnTimer = getRandomUfoSpawnTime();
    }
  }
}

function resetUfo() {
  UFO.active = false;
  ufoSpawnTimer = getRandomUfoSpawnTime();
}

function getRandomUfoSpawnTime() {
  // mellom ca 10 og 20 sekunder ved ~60 fps
  return 600 + Math.floor(Math.random() * 600);
}

// ---- Ship and projectiles ----
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


// ---- Draw Game State ----
function drawGameState() {
  //Ship (Player)
  brush.fillStyle = "Black";
  brush.fillRect(ship.x, ship.y, ship.width, ship.height);

  //Projectiles 
  for (let projectile of projectiles) {
    if (projectile.active) {
      brush.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    }
  }

  //Invaders (NPCs)
  for (let invader of INVADERS.entities) {
    if (invader.active) {
      brush.fillStyle = invader.color;
      brush.fillRect(invader.x, invader.y, INVADERS.width, INVADERS.height);
    }
  }

  //UFO
  if(UFO.active){
    brush.fillStyle = "Magenta";
    brush.fillRect(UFO.x, UFO.y, UFO.width, UFO.height);
  }

  //Score board
  brush.font = "20px serif";
  brush.fillStyle = "black";
  brush.fillText("Score: " + score, 10, 20);
}


//---- Waves and reset ----
function startNewWave(){
  ship.x = (scene.width * 0.5) - ship.width;
  ship.y = scene.height - 30;
  ship.velocityX = 0;
  ship.velocityY = 0;

  projectiles = [];
  projectileCooldown = 0;

  INVADERS.entities = [];
  INVADERS.speed = 1;
  INVADERS.direction = 1;
  
  for (let row = 0; row < INVADER_ROWS; row++) {
    let y = INVADERS.startY + row * (INVADERS.height + INVADER_ROW_SPACING);
    let x = INVADERS.startX;
    let color = INVADER_COLORS[row % INVADER_COLORS.length];

    for (let col = 0; col < npcPerRow; col++) {
      INVADERS.entities.push({
        x,
        y,
        color,
        active: true,
        width: INVADERS.width,
        height: INVADERS.height,
        points: INVADER_POINTS
      });
      x += INVADERS.width + INVADERS.padding;
    }
  }

  movementSteps = maxMovementSteps;

  resetUfo();
}

function resetGame() {
  score = 0;

  ship.x = (scene.width * 0.5) - ship.width;
  ship.y = scene.height - 30;
  ship.velocityX = 0;
  ship.velocityY = 0;

  projectiles = [];
  projectileCooldown = 0;

  //Invaders
  INVADERS.entities = [];
  INVADERS.speed = 1;
  INVADERS.direction = 1;

  for (let row = 0; row < INVADER_ROWS; row++) {
    let y = INVADERS.startY + row * (INVADERS.height + INVADER_ROW_SPACING);
    let x = INVADERS.startX;
    let color = INVADER_COLORS[row % INVADER_COLORS.length];

    for (let col = 0; col < npcPerRow; col++) {
      INVADERS.entities.push({
        x,
        y,
        color,
        active: true,
        width: INVADERS.width,
        height: INVADERS.height,
        points: INVADER_POINTS
      });
      x += INVADERS.width + INVADERS.padding;
    }
  }

  //Resett bevegelse til invaders
  movementSteps = maxMovementSteps;

  resetUfo();
}


//============= UTILITY FUNCTIONS =====================


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
