"use strict";

/* =========================================
   DICE BENDER
   Legal row progression
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

const scoreRows = Array.from(
  document.querySelectorAll(".scoreRow")
);

const numberButtons = Array.from(
  document.querySelectorAll(".numberTrack button")
);


/* CURRENT GAME INFORMATION */

let currentMode = null;

/*
  These are only the temporary selections for the current turn.
  Once confirmed, they become permanent.
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

  updateScoreSheetState();
}


/* =========================================
   ROW HELPERS
   ========================================= */

function getRowButtons(row) {
  return Array.from(
    row.querySelectorAll(".numberTrack button")
  );
}


function getButtonPosition(button) {
  const row = button.closest(".scoreRow");
  const rowButtons = getRowButtons(row);

  return rowButtons.indexOf(button);
}


/*
  All four rows progress visually from left to right.

  Fire and air increase from 2 to 12.
  Earth and water decrease from 12 to 2.

  Because the HTML already places every row in its proper progression
  order, we can use each button's left-to-right position.
*/

function getFurthestSelectedPosition(row) {
  const rowButtons = getRowButtons(row);

  let furthestPosition = -1;

  rowButtons.forEach(function (button, position) {
    if (
      button.classList.contains("crossed") &&
      position > furthestPosition
    ) {
      furthestPosition = position;
    }
  });

  return furthestPosition;
}


/* =========================================
   AVAILABILITY
   ========================================= */

function updateScoreSheetState() {
  scoreRows.forEach(function (row) {
    const rowButtons = getRowButtons(row);
    const furthestPosition = getFurthestSelectedPosition(row);

    rowButtons.forEach(function (button, position) {
      const isCrossed = button.classList.contains("crossed");
      const isConfirmed = button.classList.contains("confirmed");

      /*
        Crossed numbers remain visible.

        Any unselected number at or before the furthest selected
        position is no longer available.
      */

      if (isCrossed) {
        button.classList.remove("unavailable");
        button.disabled = isConfirmed;
        return;
      }

      if (position <= furthestPosition) {
        button.classList.add("unavailable");
        button.disabled = true;
      } else {
        button.classList.remove("unavailable");
        button.disabled = false;
      }
    });
  });

  /*
    Lock In is only active when at least one temporary
    selection exists.
  */

  mainActionButton.disabled = pendingSelections.length === 0;
}


/* =========================================
   TEMPORARY SELECTIONS
   ========================================= */

function selectNumber(button) {
  /*
    Permanent selections cannot be changed.
  */

  if (button.classList.contains("confirmed")) {
    return;
  }

  /*
    A temporary selection can always be removed by tapping it again.
  */

  if (pendingSelections.includes(button)) {
    button.classList.remove("crossed");
    button.setAttribute("aria-pressed", "false");

    pendingSelections = pendingSelections.filter(
      function (selectedButton) {
        return selectedButton !== button;
      }
    );

    updateScoreSheetState();
    return;
  }

  /*
    Unavailable numbers silently ignore taps.
  */

  if (button.classList.contains("unavailable")) {
    return;
  }

  /*
    No more than two numbers may be selected during one turn.
    A third attempted selection silently does nothing.
  */

  if (pendingSelections.length >= 2) {
    return;
  }

  button.classList.add("crossed");
  button.setAttribute("aria-pressed", "true");

  pendingSelections.push(button);

  updateScoreSheetState();
}


/* =========================================
   LOCKING IN A TURN
   ========================================= */

function lockInSelections() {
  if (pendingSelections.length === 0) {
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

  updateScoreSheetState();
}


/* =========================================
   NEW GAME
   ========================================= */

function clearEntireScoreSheet() {
  numberButtons.forEach(function (button) {
    button.classList.remove("crossed");
    button.classList.remove("confirmed");
    button.classList.remove("unavailable");

    button.setAttribute("aria-pressed", "false");
    button.disabled = false;
  });

  pendingSelections = [];

  updateScoreSheetState();
}


/* =========================================
   NUMBER-BUTTON ACTIONS
   ========================================= */

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


/* Establish the initial score-sheet appearance */

updateScoreSheetState();
