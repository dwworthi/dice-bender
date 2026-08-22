"use strict";

/* =========================================
   DICE BENDER
   Temporary and permanent selections
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
const mainActionButton = document.getElementById("mainActionButton");
const newGameButton = document.getElementById("newGameButton");
const modeLabel = document.getElementById("modeLabel");

const numberButtons = Array.from(
  document.querySelectorAll(".numberTrack button")
);


/* CURRENT GAME INFORMATION */

let currentMode = null;

/*
  These are only the temporary selections for the current turn.
  Once confirmed, they are removed from this list and become permanent.
*/

let pendingSelections = [];


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
  } else {
    modeLabel.textContent = "Physical Dice";
  }

  mainActionButton.textContent = "Lock In Selections";

  startScreen.classList.remove("active");
  gameScreen.classList.add("active");
}


/* =========================================
   TEMPORARY SELECTIONS
   ========================================= */

function selectNumber(button) {
  /*
    A confirmed number is final and cannot be changed.
  */

  if (button.classList.contains("confirmed")) {
    return;
  }

  /*
    Tapping a temporary selection again removes it.
  */

  if (button.classList.contains("crossed")) {
    button.classList.remove("crossed");
    button.setAttribute("aria-pressed", "false");

    pendingSelections = pendingSelections.filter(function (selectedButton) {
      return selectedButton !== button;
    });

    return;
  }

  /*
    A player may make no more than two selections in one turn.
  */

  if (pendingSelections.length >= 2) {
    window.alert(
      "You can select no more than two numbers during one turn."
    );

    return;
  }

  button.classList.add("crossed");
  button.setAttribute("aria-pressed", "true");

  pendingSelections.push(button);
}


/* =========================================
   LOCKING IN A TURN
   ========================================= */

function lockInSelections() {
  if (pendingSelections.length === 0) {
    window.alert("Select at least one number first.");
    return;
  }

  const shouldLockSelections = window.confirm(
    "Are you sure? This cannot be undone."
  );

  if (!shouldLockSelections) {
    return;
  }

  pendingSelections.forEach(function (button) {
    button.classList.add("confirmed");
  });

  pendingSelections = [];
}


/* =========================================
   NEW GAME
   ========================================= */

function clearEntireScoreSheet() {
  numberButtons.forEach(function (button) {
    button.classList.remove("crossed");
    button.classList.remove("confirmed");
    button.setAttribute("aria-pressed", "false");
  });

  pendingSelections = [];
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


mainActionButton.addEventListener("click", function () {
  lockInSelections();
});


newGameButton.addEventListener("click", function () {
  const shouldStartNewGame = window.confirm(
    "Start a new game? The entire score sheet will be cleared."
  );

  if (shouldStartNewGame) {
    clearEntireScoreSheet();
  }
});
