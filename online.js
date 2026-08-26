"use strict";

/* =========================================
   DICE BENDER ONLINE CONNECTION
   ========================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  getDatabase
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


const firebaseConfig = {
  apiKey:
    "AIzaSyDogW1Qiy3VFBUN-yQU8aY6zOTMmgWn38s",

  authDomain:
    "dice-bender-online.firebaseapp.com",

  databaseURL:
    "https://dice-bender-online-default-rtdb.firebaseio.com",

  projectId:
    "dice-bender-online",

  storageBucket:
    "dice-bender-online.firebasestorage.app",

  messagingSenderId:
    "410686930614",

  appId:
    "1:410686930614:web:ecc9ed343744fbf45db017",

  measurementId:
    "G-W0X5R8QEG9"
};


const firebaseApp =
  initializeApp(firebaseConfig);

const firebaseAuth =
  getAuth(firebaseApp);

const firebaseDatabase =
  getDatabase(firebaseApp);


/*
  Make the connection available to later
  multiplayer code.
*/

window.diceBenderOnline = {
  app: firebaseApp,
  auth: firebaseAuth,
  database: firebaseDatabase,
  user: null,
  ready: false
};


/* CREATE A SMALL CONNECTION INDICATOR */

const onlineConnectionStatus =
  document.createElement("div");

onlineConnectionStatus.id =
  "onlineConnectionStatus";

onlineConnectionStatus.textContent =
  "Connecting online…";

onlineConnectionStatus.style.cssText = `
  display: none;
  align-items: center;
  justify-content: center;

  width: fit-content;
  margin: 7px auto 0;
  padding: 5px 10px;

  color: #aebbc7;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 999px;
  background: rgba(255,255,255,0.05);

  font-size: 8px;
  font-weight: 850;
  letter-spacing: 0.5px;
`;


const startScreen =
  document.getElementById("startScreen");

const versionLabel =
  startScreen.querySelector(
    ".versionLabel"
  );

versionLabel.insertAdjacentElement(
  "beforebegin",
  onlineConnectionStatus
);


/* SIGN IN WITHOUT ASKING FOR AN ACCOUNT */

onAuthStateChanged(
  firebaseAuth,
  function (user) {
    if (!user) {
      return;
    }

    window.diceBenderOnline.user = user;
    window.diceBenderOnline.ready = true;

    onlineConnectionStatus.textContent =
      "● Online ready";

    onlineConnectionStatus.style.color =
      "#86e6ae";

    onlineConnectionStatus.style.borderColor =
      "rgba(93, 220, 145, 0.28)";

    window.dispatchEvent(
      new CustomEvent(
        "dicebender-online-ready",
        {
          detail: {
            userId: user.uid
          }
        }
      )
    );
  }
);


signInAnonymously(firebaseAuth)
  .catch(function (error) {
    window.diceBenderOnline.ready = false;

    onlineConnectionStatus.textContent =
      "Online connection unavailable";

    onlineConnectionStatus.style.color =
      "#ff9b94";

    onlineConnectionStatus.style.borderColor =
      "rgba(255, 105, 97, 0.32)";

    console.error(
      "Dice Bender Firebase connection failed:",
      error
    );
  });
