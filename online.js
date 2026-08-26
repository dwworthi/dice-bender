"use strict";

/* =========================================
   DICE BENDER ONLINE MULTIPLAYER
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
  getDatabase,
  get,
  onDisconnect,
  onValue,
  ref,
  remove,
  runTransaction,
  update
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


window.diceBenderOnline = {
  app: firebaseApp,
  auth: firebaseAuth,
  database: firebaseDatabase,
  user: null,
  ready: false
};


/* =========================================
   ONLINE STATE
   ========================================= */

let activeRoomCode = null;
let activeRoomReference = null;
let activeRoomUnsubscribe = null;
let currentPlayerName = "";
let currentPlayerIsHost = false;


/* =========================================
   CONNECTION INDICATOR
   ========================================= */

const onlineConnectionStatus =
  document.createElement("div");

onlineConnectionStatus.id =
  "onlineConnectionStatus";

onlineConnectionStatus.textContent =
  "Connecting online…";

onlineConnectionStatus.style.cssText = `
  display: flex;
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
  startScreen.querySelector(".versionLabel");

versionLabel.insertAdjacentElement(
  "beforebegin",
  onlineConnectionStatus
);


/* =========================================
   ONLINE MENU BUTTON
   ========================================= */

const onlineModeButton =
  document.createElement("button");

onlineModeButton.id = "onlineModeButton";
onlineModeButton.className =
  "modeButton online";

onlineModeButton.type = "button";

onlineModeButton.innerHTML = `
  <span class="buttonIcon">◎</span>

  <span class="buttonText">
    <strong>Online Multiplayer</strong>
    <small>Create or join a private room</small>
  </span>
`;

const physicalModeButton =
  document.getElementById(
    "physicalModeButton"
  );

physicalModeButton.insertAdjacentElement(
  "beforebegin",
  onlineModeButton
);


/* =========================================
   CREATE ROOM/JOIN ROOM PANEL
   ========================================= */

const onlineMenuOverlay =
  document.createElement("div");

onlineMenuOverlay.id =
  "onlineMenuOverlay";

onlineMenuOverlay.setAttribute(
  "aria-hidden",
  "true"
);

onlineMenuOverlay.innerHTML = `
  <section
    class="onlinePanel"
    role="dialog"
    aria-modal="true"
    aria-labelledby="onlinePanelTitle"
  >
    <div class="onlineElements">
      <span>🔥</span>
      <span>💨</span>
      <span>◆</span>
      <span>💧</span>
    </div>

    <p class="onlineEyebrow">
      REAL-TIME MULTIPLAYER
    </p>

    <h2 id="onlinePanelTitle">
      Enter the Arena
    </h2>

    <label for="onlinePlayerName">
      Your name
    </label>

    <input
      id="onlinePlayerName"
      type="text"
      maxlength="16"
      autocomplete="nickname"
      placeholder="Player name"
    >

    <button
      id="createOnlineRoomButton"
      class="onlinePrimaryButton"
      type="button"
    >
      Create Room
    </button>

    <div class="onlineDivider">
      <span>OR JOIN A ROOM</span>
    </div>

    <label for="onlineRoomCodeInput">
      Room code
    </label>

    <input
      id="onlineRoomCodeInput"
      class="roomCodeInput"
      type="text"
      maxlength="5"
      autocomplete="off"
      autocapitalize="characters"
      spellcheck="false"
      placeholder="ABCDE"
    >

    <button
      id="joinOnlineRoomButton"
      class="onlineSecondaryButton"
      type="button"
    >
      Join Room
    </button>

    <p
      id="onlineMenuMessage"
      class="onlineMessage"
    ></p>

    <button
      id="closeOnlineMenuButton"
      class="onlineBackButton"
      type="button"
    >
      Back
    </button>
  </section>
`;

document.body.appendChild(
  onlineMenuOverlay
);


/* =========================================
   CREATE LOBBY PANEL
   ========================================= */

const onlineLobbyOverlay =
  document.createElement("div");

onlineLobbyOverlay.id =
  "onlineLobbyOverlay";

onlineLobbyOverlay.setAttribute(
  "aria-hidden",
  "true"
);

onlineLobbyOverlay.innerHTML = `
  <section
    class="onlineLobbyCard"
    role="dialog"
    aria-modal="true"
    aria-labelledby="onlineLobbyTitle"
  >
    <p class="onlineEyebrow">
      ONLINE ROOM
    </p>

    <h2 id="onlineLobbyTitle">
      Gathering Players
    </h2>

    <p class="roomCodeLabel">
      ROOM CODE
    </p>

    <button
      id="displayRoomCode"
      type="button"
      aria-label="Copy room code"
    >
      -----
    </button>

    <p class="copyCodeInstruction">
      Tap the code to copy it
    </p>

    <div class="lobbyHeading">
      <strong>Players</strong>
      <span id="onlinePlayerCount">0</span>
    </div>

    <div id="onlinePlayerList"></div>

    <p id="onlineLobbyMessage">
      Waiting for players…
    </p>

    <button
      id="startOnlineGameButton"
      type="button"
      disabled
    >
      Start Game — Next Step
    </button>

    <button
      id="leaveOnlineRoomButton"
      type="button"
    >
      Leave Room
    </button>
  </section>
`;

document.body.appendChild(
  onlineLobbyOverlay
);


/* =========================================
   ONLINE ELEMENTS
   ========================================= */

const onlinePlayerNameInput =
  document.getElementById(
    "onlinePlayerName"
  );

const onlineRoomCodeInput =
  document.getElementById(
    "onlineRoomCodeInput"
  );

const createOnlineRoomButton =
  document.getElementById(
    "createOnlineRoomButton"
  );

const joinOnlineRoomButton =
  document.getElementById(
    "joinOnlineRoomButton"
  );

const closeOnlineMenuButton =
  document.getElementById(
    "closeOnlineMenuButton"
  );

const onlineMenuMessage =
  document.getElementById(
    "onlineMenuMessage"
  );

const displayRoomCode =
  document.getElementById(
    "displayRoomCode"
  );

const onlinePlayerCount =
  document.getElementById(
    "onlinePlayerCount"
  );

const onlinePlayerList =
  document.getElementById(
    "onlinePlayerList"
  );

const onlineLobbyMessage =
  document.getElementById(
    "onlineLobbyMessage"
  );

const leaveOnlineRoomButton =
  document.getElementById(
    "leaveOnlineRoomButton"
  );


/* =========================================
   ONLINE STYLES
   ========================================= */

const onlineStyles =
  document.createElement("style");

onlineStyles.textContent = `
  .modeButton.online {
    background:
      linear-gradient(
        135deg,
        rgba(24, 126, 142, 0.98),
        rgba(30, 66, 123, 0.98)
      );
  }

  .modeButton.online .buttonIcon {
    color: #c9f8ff;
    background: rgba(255,255,255,0.12);
    font-size: 26px;
  }

  #onlineMenuOverlay,
  #onlineLobbyOverlay {
    position: fixed;
    z-index: 8000;
    inset: 0;

    display: none;
    align-items: center;
    justify-content: center;

    padding:
      max(12px, env(safe-area-inset-top))
      max(12px, env(safe-area-inset-right))
      max(12px, env(safe-area-inset-bottom))
      max(12px, env(safe-area-inset-left));

    background: rgba(4,10,18,0.94);
  }

  #onlineMenuOverlay.open,
  #onlineLobbyOverlay.open {
    display: flex;
  }

  .onlinePanel,
  .onlineLobbyCard {
    width: 100%;
    max-width: 430px;
    max-height: 96dvh;
    overflow-y: auto;

    padding: 17px;

    color: #ffffff;
    border: 1px solid rgba(100,221,239,0.34);
    border-radius: 20px;

    background:
      linear-gradient(
        160deg,
        #153247,
        #091624
      );

    box-shadow:
      0 22px 55px rgba(0,0,0,0.62);
  }

  .onlineElements {
    display: flex;
    justify-content: center;
    gap: 8px;

    margin-bottom: 7px;
    font-size: 14px;
  }

  .onlineEyebrow {
    margin: 0 0 3px;

    color: #8fdbe5;
    font-size: 8px;
    font-weight: 950;
    letter-spacing: 1.7px;
    text-align: center;
  }

  .onlinePanel h2,
  .onlineLobbyCard h2 {
    margin: 0 0 14px;
    font-size: 22px;
    text-align: center;
  }

  .onlinePanel label {
    display: block;
    margin: 8px 2px 4px;

    color: #b9c8d3;
    font-size: 9px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: 0.7px;
  }

  .onlinePanel input {
    width: 100%;
    min-height: 45px;
    padding: 8px 12px;

    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 11px;
    outline: none;
    background: rgba(255,255,255,0.07);

    font: inherit;
    font-size: 16px;
  }

  .onlinePanel input:focus {
    border-color: rgba(103,225,239,0.72);
  }

  .onlinePanel .roomCodeInput {
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 6px;
    font-weight: 950;
  }

  .onlinePrimaryButton,
  .onlineSecondaryButton,
  #startOnlineGameButton {
    width: 100%;
    min-height: 45px;
    margin-top: 9px;

    color: #ffffff;
    border: 1px solid rgba(121,235,247,0.35);
    border-radius: 12px;

    background:
      linear-gradient(
        135deg,
        #1699ad,
        #2367ad
      );

    font: inherit;
    font-size: 13px;
    font-weight: 950;
  }

  .onlineSecondaryButton {
    background:
      linear-gradient(
        135deg,
        rgba(80,78,153,0.95),
        rgba(49,47,105,0.95)
      );
  }

  .onlineDivider {
    display: flex;
    align-items: center;
    gap: 8px;

    margin: 13px 0 3px;

    color: #7f929f;
    font-size: 7px;
    font-weight: 900;
  }

  .onlineDivider::before,
  .onlineDivider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.1);
  }

  .onlineMessage {
    min-height: 15px;
    margin: 8px 0 0;

    color: #ffaaa3;
    font-size: 9px;
    text-align: center;
  }

  .onlineBackButton,
  #leaveOnlineRoomButton {
    width: 100%;
    min-height: 39px;
    margin-top: 7px;

    color: #bdc8d1;
    border: 1px solid rgba(255,255,255,0.13);
    border-radius: 11px;
    background: rgba(255,255,255,0.05);

    font: inherit;
    font-size: 11px;
    font-weight: 850;
  }

  .roomCodeLabel {
    margin: 0;
    color: #8ca0af;
    font-size: 8px;
    font-weight: 900;
    text-align: center;
    letter-spacing: 1.5px;
  }

  #displayRoomCode {
    display: block;
    margin: 3px auto 0;
    padding: 3px 12px;

    color: #bdf6ff;
    border: 0;
    background: transparent;

    font: inherit;
    font-size: 30px;
    font-weight: 950;
    letter-spacing: 6px;
  }

  .copyCodeInstruction {
    margin: 0 0 14px;
    color: #8295a3;
    font-size: 8px;
    text-align: center;
  }

  .lobbyHeading {
    display: flex;
    justify-content: space-between;

    padding: 0 3px 6px;

    color: #bdcbd5;
    font-size: 10px;
  }

  #onlinePlayerCount {
    display: grid;
    min-width: 23px;
    height: 23px;
    place-items: center;

    margin-top: -5px;

    color: #ffffff;
    border-radius: 8px;
    background: rgba(255,255,255,0.09);
  }

  #onlinePlayerList {
    display: grid;
    gap: 6px;
  }

  .onlinePlayerEntry {
    display: flex;
    align-items: center;
    justify-content: space-between;

    min-height: 42px;
    padding: 7px 10px;

    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 11px;
    background: rgba(255,255,255,0.055);
  }

  .onlinePlayerEntry strong {
    font-size: 12px;
  }

  .onlinePlayerEntry span {
    color: #9fe6bc;
    font-size: 8px;
    font-weight: 900;
  }

  #onlineLobbyMessage {
    min-height: 15px;
    margin: 10px 0 0;

    color: #9db0bd;
    font-size: 9px;
    text-align: center;
  }

  #startOnlineGameButton:disabled {
    opacity: 0.48;
  }

  @media (max-height: 700px) {
    .onlinePanel,
    .onlineLobbyCard {
      padding: 12px;
    }

    .onlinePanel h2,
    .onlineLobbyCard h2 {
      margin-bottom: 8px;
    }
  }
`;

document.head.appendChild(onlineStyles);


/* =========================================
   HELPER FUNCTIONS
   ========================================= */

function sanitizePlayerName(name) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 16);
}


function sanitizeRoomCode(code) {
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5);
}


function createRandomRoomCode() {
  const allowedCharacters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let index = 0; index < 5; index += 1) {
    const randomPosition =
      Math.floor(
        Math.random() *
        allowedCharacters.length
      );

    code +=
      allowedCharacters[randomPosition];
  }

  return code;
}


function savePlayerName(name) {
  window.localStorage.setItem(
    "diceBenderPlayerName",
    name
  );
}


function showOnlineMessage(message) {
  onlineMenuMessage.textContent = message;
}


function setOnlineButtonsBusy(isBusy) {
  createOnlineRoomButton.disabled = isBusy;
  joinOnlineRoomButton.disabled = isBusy;

  createOnlineRoomButton.textContent =
    isBusy
      ? "Connecting…"
      : "Create Room";

  joinOnlineRoomButton.textContent =
    isBusy
      ? "Connecting…"
      : "Join Room";
}


/* =========================================
   OPEN AND CLOSE PANELS
   ========================================= */

function openOnlineMenu() {
  if (!window.diceBenderOnline.ready) {
    window.alert(
      "The online connection is still loading. Please wait a moment and try again."
    );

    return;
  }

  showOnlineMessage("");

  onlineMenuOverlay.classList.add("open");

  onlineMenuOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

  onlinePlayerNameInput.focus();
}


function closeOnlineMenu() {
  onlineMenuOverlay.classList.remove("open");

  onlineMenuOverlay.setAttribute(
    "aria-hidden",
    "true"
  );
}


function openOnlineLobby(roomCode) {
  closeOnlineMenu();

  displayRoomCode.textContent = roomCode;

  onlineLobbyOverlay.classList.add("open");

  onlineLobbyOverlay.setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeOnlineLobby() {
  onlineLobbyOverlay.classList.remove("open");

  onlineLobbyOverlay.setAttribute(
    "aria-hidden",
    "true"
  );
}


/* =========================================
   CREATE ROOM
   ========================================= */

async function createOnlineRoom() {
  const playerName =
    sanitizePlayerName(
      onlinePlayerNameInput.value
    );

  if (!playerName) {
    showOnlineMessage(
      "Enter your name first."
    );

    onlinePlayerNameInput.focus();
    return;
  }

  setOnlineButtonsBusy(true);
  showOnlineMessage("");

  const user =
    window.diceBenderOnline.user;

  try {
    let roomCreated = false;
    let roomCode = null;
    let roomReference = null;

    while (!roomCreated) {
      roomCode = createRandomRoomCode();

      roomReference = ref(
        firebaseDatabase,
        `rooms/${roomCode}`
      );

      const result =
        await runTransaction(
          roomReference,
          function (existingRoom) {
            if (existingRoom !== null) {
              return;
            }

            return {
              hostId: user.uid,
              status: "lobby",
              createdAt: Date.now(),

              players: {
                [user.uid]: {
                  uid: user.uid,
                  name: playerName,
                  joinedAt: Date.now(),
                  connected: true
                }
              }
            };
          }
        );

      roomCreated = result.committed;
    }

    currentPlayerName = playerName;
    currentPlayerIsHost = true;

    savePlayerName(playerName);

    enterOnlineRoom(
      roomCode,
      roomReference
    );
  } catch (error) {
    console.error(
      "Could not create room:",
      error
    );

    showOnlineMessage(
      "The room could not be created. Try again."
    );
  } finally {
    setOnlineButtonsBusy(false);
  }
}


/* =========================================
   JOIN ROOM
   ========================================= */

async function joinOnlineRoom() {
  const playerName =
    sanitizePlayerName(
      onlinePlayerNameInput.value
    );

  const roomCode =
    sanitizeRoomCode(
      onlineRoomCodeInput.value
    );

  if (!playerName) {
    showOnlineMessage(
      "Enter your name first."
    );

    onlinePlayerNameInput.focus();
    return;
  }

  if (roomCode.length !== 5) {
    showOnlineMessage(
      "Enter the five-character room code."
    );

    onlineRoomCodeInput.focus();
    return;
  }

  setOnlineButtonsBusy(true);
  showOnlineMessage("");

  const user =
    window.diceBenderOnline.user;

  try {
    const roomReference = ref(
      firebaseDatabase,
      `rooms/${roomCode}`
    );

    const roomSnapshot =
      await get(roomReference);

    if (!roomSnapshot.exists()) {
      showOnlineMessage(
        "That room could not be found."
      );

      return;
    }

    const room = roomSnapshot.val();

    if (room.status !== "lobby") {
      showOnlineMessage(
        "That game has already started."
      );

      return;
    }

    await update(
      ref(
        firebaseDatabase,
        `rooms/${roomCode}/players/${user.uid}`
      ),
      {
        uid: user.uid,
        name: playerName,
        joinedAt: Date.now(),
        connected: true
      }
    );

    currentPlayerName = playerName;

    currentPlayerIsHost =
      room.hostId === user.uid;

    savePlayerName(playerName);

    enterOnlineRoom(
      roomCode,
      roomReference
    );
  } catch (error) {
    console.error(
      "Could not join room:",
      error
    );

    showOnlineMessage(
      "The room could not be joined. Try again."
    );
  } finally {
    setOnlineButtonsBusy(false);
  }
}


/* =========================================
   ENTER AND WATCH ROOM
   ========================================= */

function enterOnlineRoom(
  roomCode,
  roomReference
) {
  activeRoomCode = roomCode;
  activeRoomReference = roomReference;

  openOnlineLobby(roomCode);

  if (activeRoomUnsubscribe) {
    activeRoomUnsubscribe();
  }

  const user =
    window.diceBenderOnline.user;

  const connectedReference =
    ref(
      firebaseDatabase,
      `rooms/${roomCode}/players/${user.uid}/connected`
    );

  onDisconnect(
    connectedReference
  ).set(false);

  activeRoomUnsubscribe =
    onValue(
      roomReference,
      function (snapshot) {
        if (!snapshot.exists()) {
          onlineLobbyMessage.textContent =
            "The host closed this room.";

          return;
        }

        renderOnlineLobby(
          snapshot.val()
        );
      }
    );
}


/* =========================================
   RENDER PLAYER LIST
   ========================================= */

function renderOnlineLobby(room) {
  const players =
    Object.values(room.players || {})
      .sort(function (first, second) {
        return (
          first.joinedAt -
          second.joinedAt
        );
      });

  onlinePlayerCount.textContent =
    players.length;

  onlinePlayerList.innerHTML = "";

  players.forEach(function (player) {
    const entry =
      document.createElement("div");

    entry.className =
      "onlinePlayerEntry";

    const isHost =
      player.uid === room.hostId;

    const isCurrentPlayer =
      player.uid ===
      window.diceBenderOnline.user.uid;

    let playerLabel = "";

    if (isHost) {
      playerLabel = "HOST";
    } else if (isCurrentPlayer) {
      playerLabel = "YOU";
    } else if (player.connected === false) {
      playerLabel = "OFFLINE";
    } else {
      playerLabel = "READY";
    }

    entry.innerHTML = `
      <strong></strong>
      <span>${playerLabel}</span>
    `;

    entry.querySelector("strong")
      .textContent = player.name;

    onlinePlayerList.appendChild(entry);
  });

  currentPlayerIsHost =
    room.hostId ===
    window.diceBenderOnline.user.uid;

  if (currentPlayerIsHost) {
    onlineLobbyMessage.textContent =
      players.length < 2
        ? "Share the room code with your friends."
        : `${players.length} players are ready.`;

    document.getElementById(
      "startOnlineGameButton"
    ).textContent =
      "Start Game — Next Step";
  } else {
    onlineLobbyMessage.textContent =
      "Waiting for the host to start…";

    document.getElementById(
      "startOnlineGameButton"
    ).style.display = "none";
  }
}


/* =========================================
   LEAVE ROOM
   ========================================= */

async function leaveOnlineRoom() {
  if (
    !activeRoomCode ||
    !window.diceBenderOnline.user
  ) {
    closeOnlineLobby();
    return;
  }

  const userId =
    window.diceBenderOnline.user.uid;

  try {
    if (currentPlayerIsHost) {
      await remove(
        ref(
          firebaseDatabase,
          `rooms/${activeRoomCode}`
        )
      );
    } else {
      await remove(
        ref(
          firebaseDatabase,
          `rooms/${activeRoomCode}/players/${userId}`
        )
      );
    }
  } catch (error) {
    console.error(
      "Could not leave room:",
      error
    );
  }

  if (activeRoomUnsubscribe) {
    activeRoomUnsubscribe();
    activeRoomUnsubscribe = null;
  }

  activeRoomCode = null;
  activeRoomReference = null;
  currentPlayerIsHost = false;

  closeOnlineLobby();
}


/* =========================================
   BUTTON ACTIONS
   ========================================= */

onlineModeButton.addEventListener(
  "click",
  openOnlineMenu
);

closeOnlineMenuButton.addEventListener(
  "click",
  closeOnlineMenu
);

createOnlineRoomButton.addEventListener(
  "click",
  createOnlineRoom
);

joinOnlineRoomButton.addEventListener(
  "click",
  joinOnlineRoom
);

leaveOnlineRoomButton.addEventListener(
  "click",
  leaveOnlineRoom
);

displayRoomCode.addEventListener(
  "click",
  async function () {
    if (!activeRoomCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        activeRoomCode
      );

      onlineLobbyMessage.textContent =
        "Room code copied!";
    } catch (error) {
      onlineLobbyMessage.textContent =
        `Room code: ${activeRoomCode}`;
    }
  }
);

onlineRoomCodeInput.addEventListener(
  "input",
  function () {
    onlineRoomCodeInput.value =
      sanitizeRoomCode(
        onlineRoomCodeInput.value
      );
  }
);


/* =========================================
   RESTORE SAVED PLAYER NAME
   ========================================= */

const savedPlayerName =
  window.localStorage.getItem(
    "diceBenderPlayerName"
  );

if (savedPlayerName) {
  onlinePlayerNameInput.value =
    savedPlayerName;
}


/* =========================================
   FIREBASE ANONYMOUS SIGN-IN
   ========================================= */

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
      "rgba(93,220,145,0.28)";

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
      "rgba(255,105,97,0.32)";

    console.error(
      "Dice Bender Firebase connection failed:",
      error
    );
  });