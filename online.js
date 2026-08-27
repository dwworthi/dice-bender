"use strict";

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getDatabase, get, onDisconnect, onValue, ref, remove, runTransaction, set, update } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDogW1Qiy3VFBUN-yQU8aY6zOTMmgWn38s",
  authDomain: "dice-bender-online.firebaseapp.com",
  databaseURL: "https://dice-bender-online-default-rtdb.firebaseio.com",
  projectId: "dice-bender-online",
  storageBucket: "dice-bender-online.firebasestorage.app",
  messagingSenderId: "410686930614",
  appId: "1:410686930614:web:ecc9ed343744fbf45db017",
  measurementId: "G-W0X5R8QEG9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

window.diceBenderOnline = { app, auth, database, user: null, ready: false };

let roomCode = null;
let roomRef = null;
let unsubscribeRoom = null;
let room = null;
let playerName = "";
let isHost = false;
let gameOpen = false;
let preparedTurn = 0;
let animatedRoll = 0;
let advancing = false;
let timer = null;

const RESPONSE_TIME = 45000;
const startScreen = document.getElementById("startScreen");
const versionLabel = startScreen.querySelector(".versionLabel");
const physicalButton = document.getElementById("physicalModeButton");
const mainButton = document.getElementById("mainActionButton");

const connection = document.createElement("div");
connection.id = "onlineConnectionStatus";
connection.textContent = "Connecting onlineâ¦";
connection.style.cssText = "display:flex;width:fit-content;margin:7px auto 0;padding:5px 10px;color:#aebbc7;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.05);font-size:8px;font-weight:850";
versionLabel.insertAdjacentElement("beforebegin", connection);

const onlineButton = document.createElement("button");
onlineButton.className = "modeButton online";
onlineButton.type = "button";
onlineButton.innerHTML = '<span class="buttonIcon">â</span><span class="buttonText"><strong>Online Multiplayer</strong><small>Create or join a private room</small></span>';
physicalButton.insertAdjacentElement("beforebegin", onlineButton);

const menu = document.createElement("div");
menu.id = "onlineMenuOverlay";
menu.innerHTML = `<section class="onlineCard"><p class="onlineEyebrow">REAL-TIME MULTIPLAYER</p><h2>Enter the Arena</h2><label>Your name</label><input id="onlinePlayerName" maxlength="16" autocomplete="nickname" placeholder="Player name"><button id="createOnlineRoomButton" class="onlinePrimary">Create Room</button><div class="onlineDivider">OR JOIN A ROOM</div><label>Room code</label><input id="onlineRoomCodeInput" class="codeInput" maxlength="5" autocomplete="off" autocapitalize="characters" placeholder="ABCDE"><button id="joinOnlineRoomButton" class="onlinePrimary secondary">Join Room</button><p id="onlineMenuMessage" class="onlineMessage"></p><button id="closeOnlineMenuButton" class="onlineBack">Back</button></section>`;
document.body.appendChild(menu);

const lobby = document.createElement("div");
lobby.id = "onlineLobbyOverlay";
lobby.innerHTML = `<section class="onlineCard"><p class="onlineEyebrow">ONLINE ROOM</p><h2>Gathering Players</h2><p class="roomLabel">ROOM CODE</p><button id="displayRoomCode">-----</button><p class="copyHint">Tap the code to copy it</p><div class="lobbyHeading"><strong>Players</strong><span id="onlinePlayerCount">0</span></div><div id="onlinePlayerList"></div><p id="onlineLobbyMessage" class="onlineMessage">Waiting for playersâ¦</p><button id="startOnlineGameButton" class="onlinePrimary" disabled>Start Game</button><button id="leaveOnlineRoomButton" class="onlineBack">Leave Room</button></section>`;
document.body.appendChild(lobby);

const gameBar = document.createElement("div");
gameBar.id = "onlineGameBar";
gameBar.innerHTML = `<strong id="onlineTurnStatus">Waitingâ¦</strong><div class="barRow"><span id="onlineGameRoomCode"></span><span id="onlineResponseProgress"></span><button id="onlineLeaveGameButton">Leave</button></div><button id="continueWithoutWaitingButton">Continue Without Waiting</button>`;
document.body.appendChild(gameBar);

const results = document.createElement("div");
results.id = "onlineResultsOverlay";
results.innerHTML = `<section class="onlineCard"><p class="onlineEyebrow">GAME COMPLETE</p><h2>Final Results</h2><div id="onlineResultsList"></div><button id="closeOnlineResultsButton" class="onlinePrimary">Return to Main Menu</button></section>`;
document.body.appendChild(results);

const style = document.createElement("style");
style.textContent = `
.modeButton.online{background:linear-gradient(135deg,#187e8e,#1e427b)}.modeButton.online .buttonIcon{color:#c9f8ff;background:rgba(255,255,255,.12);font-size:26px}
#onlineMenuOverlay,#onlineLobbyOverlay,#onlineResultsOverlay{position:fixed;z-index:8000;inset:0;display:none;align-items:center;justify-content:center;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));background:rgba(4,10,18,.95)}
#onlineMenuOverlay.open,#onlineLobbyOverlay.open,#onlineResultsOverlay.open{display:flex}.onlineCard{width:100%;max-width:430px;max-height:96dvh;overflow:auto;padding:17px;color:#fff;border:1px solid rgba(100,221,239,.34);border-radius:20px;background:linear-gradient(160deg,#153247,#091624);box-shadow:0 22px 55px rgba(0,0,0,.62)}
.onlineEyebrow{margin:0 0 3px;color:#8fdbe5;font-size:8px;font-weight:950;letter-spacing:1.7px;text-align:center}.onlineCard h2{margin:0 0 14px;font-size:22px;text-align:center}.onlineCard label{display:block;margin:8px 2px 4px;color:#b9c8d3;font-size:9px;font-weight:850;text-transform:uppercase}.onlineCard input{box-sizing:border-box;width:100%;min-height:45px;padding:8px 12px;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:11px;outline:none;background:rgba(255,255,255,.07);font:inherit;font-size:16px}.codeInput{text-align:center;text-transform:uppercase;letter-spacing:6px;font-weight:950}
.onlinePrimary,.onlineBack{width:100%;min-height:45px;margin-top:9px;color:#fff;border:1px solid rgba(121,235,247,.35);border-radius:12px;background:linear-gradient(135deg,#1699ad,#2367ad);font:inherit;font-size:13px;font-weight:950}.onlinePrimary.secondary{background:linear-gradient(135deg,#504e99,#312f69)}.onlineBack{min-height:39px;color:#bdc8d1;border-color:rgba(255,255,255,.13);background:rgba(255,255,255,.05);font-size:11px}.onlinePrimary:disabled{opacity:.48}.onlineDivider{margin:13px 0 3px;color:#7f929f;font-size:7px;font-weight:900;text-align:center}.onlineMessage{min-height:15px;margin:8px 0 0;color:#9db0bd;font-size:9px;text-align:center}
.roomLabel{margin:0;color:#8ca0af;font-size:8px;font-weight:900;text-align:center;letter-spacing:1.5px}#displayRoomCode{display:block;margin:3px auto 0;padding:3px 12px;color:#bdf6ff;border:0;background:transparent;font:inherit;font-size:30px;font-weight:950;letter-spacing:6px}.copyHint{margin:0 0 14px;color:#8295a3;font-size:8px;text-align:center}.lobbyHeading{display:flex;justify-content:space-between;padding:0 3px 6px;color:#bdcbd5;font-size:10px}#onlinePlayerList{display:grid;gap:6px}.onlinePlayerEntry{display:flex;align-items:center;justify-content:space-between;min-height:42px;padding:7px 10px;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.055)}.onlinePlayerEntry strong{font-size:12px}.onlinePlayerEntry span{color:#9fe6bc;font-size:8px;font-weight:900}
#onlineGameBar{position:fixed;z-index:7000;top:max(5px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);display:none;width:min(94%,430px);box-sizing:border-box;padding:7px 9px;color:#fff;border:1px solid rgba(116,229,241,.3);border-radius:13px;background:rgba(8,23,36,.94);text-align:center}#onlineGameBar.open{display:block}#onlineTurnStatus{color:#d8faff;font-size:10px}.barRow{display:flex;align-items:center;justify-content:space-between;gap:7px;margin-top:4px;color:#9fb2bf;font-size:8px;font-weight:850}#onlineLeaveGameButton{padding:3px 8px;color:#ffb1aa;border:1px solid rgba(255,116,105,.28);border-radius:7px;background:rgba(255,97,86,.08);font-size:8px;font-weight:900}#continueWithoutWaitingButton{display:none;width:100%;min-height:31px;margin-top:6px;color:#ffe0a2;border:1px solid rgba(255,197,87,.35);border-radius:8px;background:rgba(167,104,19,.22);font-size:9px;font-weight:900}#continueWithoutWaitingButton.show{display:block}
.onlineResultEntry{margin-bottom:8px;padding:10px 12px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.055)}.resultHead{display:flex;justify-content:space-between}.resultHead span{color:#bdf6ff;font-weight:950}.resultDetails{margin-top:6px;color:#aebfc9;font-size:8px;line-height:1.55}`;
document.head.appendChild(style);

const $ = id => document.getElementById(id);
const nameInput = $("onlinePlayerName");
const codeInput = $("onlineRoomCodeInput");
const menuMessage = $("onlineMenuMessage");
const lobbyMessage = $("onlineLobbyMessage");
const startButton = $("startOnlineGameButton");
const turnStatus = $("onlineTurnStatus");
const progress = $("onlineResponseProgress");
const continueButton = $("continueWithoutWaitingButton");

function uid() { return window.diceBenderOnline.user?.uid || null; }
function bridge() { return window.diceBenderGame || null; }
function cleanName(value) { return value.trim().replace(/\s+/g, " ").slice(0, 16); }
function cleanCode(value) { return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5); }
function randomCode() { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from({length:5}, () => chars[Math.floor(Math.random()*chars.length)]).join(""); }
function die() { return Math.floor(Math.random() * 6) + 1; }
function dice() { return { whiteOne:die(), whiteTwo:die(), fire:die(), air:die(), earth:die(), water:die() }; }
function emptySheet() { return { rows:{ fire:{crossedNumbers:[],locked:false}, air:{crossedNumbers:[],locked:false}, earth:{crossedNumbers:[],locked:false}, water:{crossedNumbers:[],locked:false} }, penalties:0, totalScore:0 }; }
function players(r) { return Object.values(r.players || {}).sort((a,b) => (a.joinedAt||0)-(b.joinedAt||0)); }
function rollerId(game) { return (game.playerOrder || [])[Number(game.rollerIndex)||0]; }
function playerLabel(r,id) { return r.players?.[id]?.name || "Player"; }
function locks(game) { return Object.keys(game.globalLocks || {}).filter(c => game.globalLocks[c]); }
function show(el) { el.classList.add("open"); }
function hide(el) { el.classList.remove("open"); }

function openMenu() {
  if (!window.diceBenderOnline.ready) return alert("The online connection is still loading. Try again in a moment.");
  menuMessage.textContent = ""; show(menu); nameInput.focus();
}

async function createRoom() {
  const name = cleanName(nameInput.value);
  if (!name) return menuMessage.textContent = "Enter your name first.";
  $("createOnlineRoomButton").disabled = true;
  try {
    let created = false, code, target;
    while (!created) {
      code = randomCode(); target = ref(database, `rooms/${code}`);
      const result = await runTransaction(target, old => old !== null ? undefined : ({ hostId:uid(), status:"lobby", createdAt:Date.now(), players:{ [uid()]:{uid:uid(),name,joinedAt:Date.now(),connected:true} } }));
      created = result.committed;
    }
    playerName = name; isHost = true; localStorage.setItem("diceBenderPlayerName", name); enterRoom(code,target);
  } catch (error) { console.error(error); menuMessage.textContent = "The room could not be created. Try again."; }
  $("createOnlineRoomButton").disabled = false;
}

async function joinRoom() {
  const name = cleanName(nameInput.value), code = cleanCode(codeInput.value);
  if (!name) return menuMessage.textContent = "Enter your name first.";
  if (code.length !== 5) return menuMessage.textContent = "Enter the five-character room code.";
  try {
    const target = ref(database, `rooms/${code}`), snap = await get(target);
    if (!snap.exists()) return menuMessage.textContent = "That room could not be found.";
    if (snap.val().status !== "lobby") return menuMessage.textContent = "That game has already started.";
    await set(ref(database,`rooms/${code}/players/${uid()}`), {uid:uid(),name,joinedAt:Date.now(),connected:true});
    playerName = name; localStorage.setItem("diceBenderPlayerName", name); enterRoom(code,target);
  } catch (error) { console.error(error); menuMessage.textContent = "The room could not be joined. Try again."; }
}

function enterRoom(code,target) {
  roomCode=code; roomRef=target; hide(menu); show(lobby); $("displayRoomCode").textContent=code;
  if (unsubscribeRoom) unsubscribeRoom();
  const connected=ref(database,`rooms/${code}/players/${uid()}/connected`); set(connected,true); onDisconnect(connected).set(false);
  unsubscribeRoom=onValue(target,snap=>{ if(!snap.exists()) return closedRoom(); room=snap.val(); isHost=room.hostId===uid(); if(room.status==="lobby") renderLobby(); else if(room.status==="playing") handleGame(); else if(room.status==="finished") finishGame(); });
}

function renderLobby() {
  const list=players(room); $("onlinePlayerCount").textContent=list.length; $("onlinePlayerList").innerHTML="";
  list.forEach(p=>{ const entry=document.createElement("div"); entry.className="onlinePlayerEntry"; const label=p.uid===room.hostId?"HOST":p.uid===uid()?"YOU":p.connected===false?"OFFLINE":"READY"; entry.innerHTML=`<strong></strong><span>${label}</span>`; entry.querySelector("strong").textContent=p.name; $("onlinePlayerList").appendChild(entry); });
  startButton.style.display=isHost?"block":"none"; startButton.disabled=list.length<2;
  lobbyMessage.textContent=isHost?(list.length<2?"Share the room code with your friends.":`${list.length} players are ready.`):"Waiting for the host to startâ¦";
}

async function startGame() {
  if(!isHost) return; const list=players(room).filter(p=>p.connected!==false); if(list.length<2) return;
  const order=list.map(p=>p.uid), sheets={}; order.forEach(id=>sheets[id]=emptySheet()); startButton.disabled=true;
  await update(roomRef,{status:"playing",game:{status:"playing",phase:"awaiting_roll",turnNumber:1,rollerIndex:Math.floor(Math.random()*order.length),playerOrder:order,rollId:0,deadline:0,globalLocks:{},sheets,responses:{}}});
}

function prepareGame() {
  const b=bridge(); if(!b) { alert("The online game bridge did not load. Reload and try again."); return false; }
  if(!gameOpen){ b.start(playerName); gameOpen=true; hide(lobby); show(gameBar); $("onlineGameRoomCode").textContent=`Room ${roomCode}`; }
  const game=room.game;
  if(Number(game.turnNumber)!==preparedTurn){ if(game.sheets?.[uid()]) b.loadSheet(game.sheets[uid()]); b.setGlobalLocks(locks(game)); preparedTurn=Number(game.turnNumber); }
  return true;
}

function handleGame() {
  if(!prepareGame()) return; const b=bridge(), game=room.game, roller=rollerId(game), name=playerLabel(room,roller), responses=game.responses||{}, order=game.playerOrder||[];
  progress.textContent=game.phase==="responding"?`${Object.keys(responses).length}/${order.length} ready`:`Turn ${game.turnNumber}`;
  if(game.phase==="awaiting_roll"){
    stopTimer(); continueButton.classList.remove("show");
    if(roller===uid()){turnStatus.textContent="Your turn â roll the dice"; b.setTurn({role:"roller",rollerName:playerName,diceReady:false});}
    else {turnStatus.textContent=`Waiting for ${name} to roll`; b.setTurn({role:"waiting",rollerName:name,diceReady:false});}
    return;
  }
  if(game.phase==="responding"){
    startTimer(game); const done=Boolean(responses[uid()]);
    if(done){turnStatus.textContent="Selection locked in â waiting for others"; b.setTurn({role:"waiting",rollerName:name,diceReady:false,diceValues:game.dice});}
    else {const role=roller===uid()?"roller":"responder"; turnStatus.textContent=role==="roller"?"Choose your white and colored actions":`Use the white dice or skip â ${name} rolled`; b.setTurn({role,rollerName:name,diceReady:true,diceValues:game.dice});}
    if(game.dice && Number(game.rollId)>animatedRoll){animatedRoll=Number(game.rollId); b.animateDice(game.dice,true);}
    if(isHost && order.every(id=>responses[id])) advanceTurn(true);
  }
}

async function rollDice() {
  const game=room?.game; if(!game || game.phase!=="awaiting_roll" || rollerId(game)!==uid()) return;
  mainButton.disabled=true; await update(ref(database,`rooms/${roomCode}/game`),{phase:"responding",dice:dice(),rollId:Number(game.rollId||0)+1,deadline:Date.now()+RESPONSE_TIME,responses:{}});
}

async function submitResponse() {
  const game=room?.game,b=bridge(); if(!game || game.phase!=="responding" || game.responses?.[uid()]) return;
  const pending=b.getPending(), roller=rollerId(game)===uid(); if(roller && pending.selectionCount===0 && !pending.hasPenalty) return;
  if(pending.lockColors?.length && !confirm(`${pending.lockColors.join(" and ")} will become locked for every player after this turn. Continue?`)) return;
  mainButton.disabled=true; const skipped=!roller && pending.selectionCount===0; const sheet=skipped?b.skipWhite():b.confirmSelections();
  try { await update(ref(database,`rooms/${roomCode}/game`),{[`sheets/${uid()}`]:sheet,[`responses/${uid()}`]:{uid:uid(),submittedAt:Date.now(),skipped,lockColors:pending.lockColors||[]}}); }
  catch(error){console.error(error); alert("Your selection could not be saved. Please try again.");}
}

async function advanceTurn(requireAll) {
  if(advancing || !isHost) return; advancing=true;
  try {
    await runTransaction(ref(database,`rooms/${roomCode}/game`),game=>{
      if(!game || game.phase!=="responding") return; const order=game.playerOrder||[], responses=game.responses||{};
      if(requireAll && !order.every(id=>responses[id])) return;
      const globalLocks={...(game.globalLocks||{})}; Object.values(responses).forEach(r=>(r.lockColors||[]).forEach(c=>globalLocks[c]=true));
      const sheets=game.sheets||{}, ended=Object.keys(globalLocks).filter(c=>globalLocks[c]).length>=2 || Object.values(sheets).some(s=>Number(s.penalties||0)>=4);
      if(ended){const finalScores={}; order.forEach(id=>finalScores[id]=Number(sheets[id]?.totalScore||0)); return {...game,status:"finished",phase:"finished",globalLocks,finalScores,finishedAt:Date.now()};}
      return {...game,phase:"awaiting_roll",turnNumber:Number(game.turnNumber||0)+1,rollerIndex:(Number(game.rollerIndex||0)+1)%order.length,dice:null,responses:null,deadline:0,globalLocks};
    });
    const snap=await get(ref(database,`rooms/${roomCode}/game`)); if(snap.exists() && snap.val().status==="finished") await update(roomRef,{status:"finished"});
  } finally {advancing=false;}
}

function stopTimer(){if(timer)clearInterval(timer);timer=null;}
function startTimer(game){stopTimer(); const tick=()=>{const left=Math.max(0,Math.ceil((Number(game.deadline||0)-Date.now())/1000)),responses=room?.game?.responses||{},total=room?.game?.playerOrder?.length||0;progress.textContent=`${Object.keys(responses).length}/${total} ready Â· ${left}s`;continueButton.classList.toggle("show",isHost&&left===0);};tick();timer=setInterval(tick,1000);}

function finishGame(){stopTimer();hide(lobby);hide(gameBar);const game=room.game||{},sheets=game.sheets||{},order=game.playerOrder||[];const ranked=order.map(id=>({id,name:playerLabel(room,id),sheet:sheets[id]||emptySheet()})).sort((a,b)=>Number(b.sheet.totalScore||0)-Number(a.sheet.totalScore||0));$("onlineResultsList").innerHTML="";ranked.forEach((r,i)=>{const el=document.createElement("div");el.className="onlineResultEntry";const rows=r.sheet.rows||{};el.innerHTML=`<div class="resultHead"><strong></strong><span>${Number(r.sheet.totalScore||0)} pts</span></div><div class="resultDetails">Fire: ${(rows.fire?.crossedNumbers||[]).length} Â· Air: ${(rows.air?.crossedNumbers||[]).length} Â· Earth: ${(rows.earth?.crossedNumbers||[]).length} Â· Water: ${(rows.water?.crossedNumbers||[]).length}<br>Penalties: ${Number(r.sheet.penalties||0)}</div>`;el.querySelector("strong").textContent=(i===0?"ð ":`${i+1}. `)+r.name;$("onlineResultsList").appendChild(el);});show(results);}

async function leaveRoom(){const id=uid(),b=bridge();try{if(roomCode&&id){if(isHost)await remove(ref(database,`rooms/${roomCode}`));else if(room?.status==="lobby")await remove(ref(database,`rooms/${roomCode}/players/${id}`));else await set(ref(database,`rooms/${roomCode}/players/${id}/connected`),false);}}catch(e){console.error(e);}if(unsubscribeRoom)unsubscribeRoom();unsubscribeRoom=null;roomCode=null;roomRef=null;room=null;hide(lobby);hide(results);hide(gameBar);stopTimer();if(b&&gameOpen)b.exit();gameOpen=false;preparedTurn=0;animatedRoll=0;}
function closedRoom(){if(unsubscribeRoom)unsubscribeRoom();unsubscribeRoom=null;const b=bridge();hide(lobby);hide(results);hide(gameBar);stopTimer();if(b&&gameOpen)b.exit();gameOpen=false;roomCode=null;alert("The host closed the online room.");}

mainButton.addEventListener("click",event=>{const b=bridge();if(!b?.getTurn().active)return;event.preventDefault();event.stopImmediatePropagation();if(room?.game?.phase==="awaiting_roll")rollDice();else if(room?.game?.phase==="responding")submitResponse();},true);
onlineButton.addEventListener("click",openMenu);
$("closeOnlineMenuButton").addEventListener("click",()=>hide(menu));
$("createOnlineRoomButton").addEventListener("click",createRoom);
$("joinOnlineRoomButton").addEventListener("click",joinRoom);
startButton.addEventListener("click",startGame);
$("leaveOnlineRoomButton").addEventListener("click",leaveRoom);
$("onlineLeaveGameButton").addEventListener("click",()=>{if(confirm(isHost?"Leaving will close the game for everyone. Leave?":"Leave this online game?"))leaveRoom();});
continueButton.addEventListener("click",()=>advanceTurn(false));
$("closeOnlineResultsButton").addEventListener("click",leaveRoom);
$("displayRoomCode").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(roomCode);lobbyMessage.textContent="Room code copied!";}catch{lobbyMessage.textContent=`Room code: ${roomCode}`;}});
codeInput.addEventListener("input",()=>codeInput.value=cleanCode(codeInput.value));

const savedName=localStorage.getItem("diceBenderPlayerName");if(savedName)nameInput.value=savedName;
onAuthStateChanged(auth,user=>{if(!user)return;window.diceBenderOnline.user=user;window.diceBenderOnline.ready=true;connection.textContent="â Online ready";connection.style.color="#86e6ae";connection.style.borderColor="rgba(93,220,145,.28)";});
signInAnonymously(auth).catch(error=>{console.error(error);connection.textContent="Online connection unavailable";connection.style.color="#ff9b94";});