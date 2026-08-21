"use strict";

/* =========================================
   DICE BENDER
   First prototype navigation
   ========================================= */


/* SCREEN ELEMENTS */

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");


/* START SCREEN BUTTONS */

const virtualModeButton = document.getElementById("virtualModeButton");
const physicalModeButton = document.getElementById("physicalModeButton");
const howToPlayButton = document.getElementById("howToPlayButton");


/* GAME SCREEN BUTTONS */

const backButton = document.getElementById("backButton");
const menuButton = document.getElementById("menuButton");
const undoButton = document.getElementById("undoButton");
const mainActionButton = document.getElementById("mainActionButton");
const newGameButton = document.getElementById("newGameButton");

const modeLabel = document.getElementById("modeLabel");


/* CURRENT GAME INFORMATION */

let currentMode = null;


/* =========================================
   SCREEN CHANGING
   ========================================= */

function showStartScreen() {
  gameScreen.classList.remove("active");
  startScreen.classList.add("active");
}


function showGameScreen(mode) {
  currentMode = mode;

  if (mode === "virtual") {
    modeLabel.textContent = "Virtual Dice";
    mainActionButton.textContent = "Roll Dice";
  } else {
    modeLabel.textContent = "Physical Dice";
    mainActionButton.textContent = "Select a Number";
  }

  startScreen.classList.remove("active");
  gameScreen.classList.add("active");
}


/* =========================================
   START SCREEN ACTIONS
   ========================================= */

virtualModeButton.addEventListener("click", function () {
  showGameScreen("virtual");
});


physicalModeButton.addEventListener("click", function () {
  showGameScreen("physical");
});


howToPlayButton.addEventListener("click", function () {
  window.alert(
    "Full instructions will be added after the basic game rules are working."
  );
});


/* =========================================
   GAME SCREEN ACTIONS
   ========================================= */

backButton.addEventListener("click", function () {
  showStartScreen();
});


menuButton.addEventListener("click", function () {
  window.alert(
    "The game menu will be added in a later development stage."
  );
});


undoButton.addEventListener("click", function () {
  window.alert(
    "Undo will become active when score-sheet selections are added."
  );
});


mainActionButton.addEventListener("click", function () {
  if (currentMode === "virtual") {
    window.alert(
      "Virtual dice rolling will be added after the score sheet is working."
    );
  } else {
    window.alert(
      "Number selection will be added in the next development stage."
    );
  }
});


newGameButton.addEventListener("click", function () {
  const shouldStartNewGame = window.confirm(
    "Return to the Dice Bender start screen?"
  );

  if (shouldStartNewGame) {
    currentMode = null;
    showStartScreen();
  }
});
