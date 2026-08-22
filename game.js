"use strict";

/* =========================================
   DICE BENDER
   Score-sheet selection prototype
   ========================================= */


/* SCREEN ELEMENTS */

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");


/* START SCREEN BUTTONS */

const virtualModeButton = document.getElementById("virtualModeButton");
const physicalModeButton = document.getElementById("physicalModeButton");
const howToPlayButton = document.getElementById("howToPlayButton");


/* GAME SCREEN ELEMENTS */

const backButton = document.getElementById("backButton");
const menuButton = document.getElementById("menuButton");
const undoButton = document.getElementById("undoButton");
const mainActionButton = document.getElementById("mainActionButton");
const newGameButton = document.getElementById("newGameButton");
const modeLabel = document.getElementById("modeLabel");

const numberButtons = Array.from(
  document.querySelectorAll(".numberTrack button")
);


/* CURRENT GAME INFORMATION */

let currentMode = null;

/*
  Every selected button is added here in order.
  Undo removes the most recent selection.
*/

let selectionHistory = [];


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
   SCORE-SHEET SELECTIONS
   ========================================= */

function selectNumber(button) {
  /*
    A crossed number cannot be selected again.
    Use Undo if the selection was accidental.
  */

  if (button.classList.contains("crossed")) {
    return;
  }

  button.classList.add("crossed");
  button.setAttribute("aria-pressed", "true");

  selectionHistory.push(button);
}


function undoLastSelection() {
  const mostRecentButton = selectionHistory.pop();

  if (!mostRecentButton) {
    window.alert("There are no selections to undo.");
    return;
  }

  mostRecentButton.classList.remove("crossed");
  mostRecentButton.setAttribute("aria-pressed", "false");
}


function clearScoreSheet() {
  numberButtons.forEach(function (button) {
    button.classList.remove("crossed");
    button.setAttribute("aria-pressed", "false");
  });

  selectionHistory = [];
}


/* Add a tap action to every number box */

numberButtons.forEach(function (button) {
  button.setAttribute("aria-pressed", "false");

  button.addEventListener("click", function () {
    selectNumber(button);
  });
});


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
  undoLastSelection();
});


mainActionButton.addEventListener("click", function () {
  if (currentMode === "virtual") {
    window.alert(
      "Virtual dice rolling will be added after the score sheet rules are working."
    );
  } else {
    window.alert(
      "Tap any number on the score sheet to cross it out."
    );
  }
});


newGameButton.addEventListener("click", function () {
  const shouldStartNewGame = window.confirm(
    "Start a new game? All crossed numbers will be cleared."
  );

  if (shouldStartNewGame) {
    clearScoreSheet();
  }
});
