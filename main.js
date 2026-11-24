import { CONFIG, WEAPONS } from "./config.js?v=20261124-4";
import { InputController } from "./input.js?v=20261124-4";
import { WorldMap } from "./map.js?v=20261124-4";
import { PlayerController } from "./player.js?v=20261124-4";
import { WeaponSystem } from "./weapons.js?v=20261124-4";
import { BotManager } from "./bots.js?v=20261124-4";
import { LootSystem } from "./loot.js?v=20261124-4";
import { SafeZone } from "./zone.js?v=20261124-4";
import { AudioSystem } from "./audio.js?v=20261124-4";
import { UI } from "./ui.js?v=20261124-4";
import { Minimap } from "./minimap.js?v=20261124-4";
import { NetworkClient } from "./network.js?v=20261124-4";
import { MatchState } from "./match.js?v=20261124-4";
import { DebugTools } from "./debug.js?v=20261124-4";
import { BattleRoyaleSystem } from "./battleRoyale.js?v=20261124-4";
import { MultiplayerAvatars } from "./multiplayer.js?v=20261124-4";

const T = window.THREE;

let scene;
let camera;
let renderer;
let clock;

let input;
let map;
let player;
let weapons;
let bots;
let loot;
let zone;
let audio;
let network;
let match;
let minimap;
let debug;
let battleRoyale;
let multiplayerAvatars;

let initialized = false;
let running = false;
let starting = false;
let lastPlayerHP = 100;
let lastFootstep = 0;

const ui = new UI();
try {
  ui.bind();
} catch (error) {
  console.error(
    "LAST ALIVE UI BIND ERROR:",
    error
  );
}

const $ = id =>
  document.getElementById(id);

window.__LAST_ALIVE_READY = false;
window.__LAST_ALIVE_GAME_INITIALIZED = false;
window.__LAST_ALIVE_MATCH_RUNNING = false;

function status(text, error = false) {
  const el = $("bootStatus");

  if (!el) return;

  el.textContent = text;
  el.classList.toggle(
    "error",
    error
  );
}

function errorScreen(message) {
  console.error(
    "LAST ALIVE ERROR:",
    message
  );

  status(
    "ENGINE ERROR · " + message,
    true
  );

  const toast = $("toast");

  if (toast) {
    toast.textContent =
      "ERROR · " + message;

    toast.style.opacity = "1";
  }
}

function initGame() {

  if (initialized) {
    return;
  }

  if (!T) {
    throw new Error(
      "Three.js failed to load"
    );
  }

  /*
  =========================================
  SCENE
  =========================================
  */

  scene = new T.Scene();

  scene.background = new T.Color(0x07111f);

  scene.fog = new T.Fog(0x07111f, 180, 1250);

  /*
  =========================================
  CAMERA — TRUE FIRST PERSON
  =========================================
  */

  camera =
    new T.PerspectiveCamera(
      76,
      window.innerWidth /
        window.innerHeight,
      0.03,
      1800
    );

  camera.rotation.order =
    "YXZ";

  /*
  =========================================
  RENDERER
  =========================================
  */

  const canvas =
    $("game");

  if (!canvas) {
    throw new Error(
      "#game canvas missing"
    );
  }

  renderer =
    new T.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference:
        "high-performance"
    });

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio || 1,
      1.5
    )
  );

  renderer.outputColorSpace =
    T.SRGBColorSpace;

  renderer.toneMapping =
    T.ACESFilmicToneMapping;

  renderer.toneMappingExposure =
    1.15;

  renderer.shadowMap.enabled = true;

  renderer.shadowMap.type =
    T.PCFSoftShadowMap;

  /*
  =========================================
  LIGHTING
  =========================================
  */

  const hemi =
    new T.HemisphereLight(0x9fe7ff, 0x050914, 2.8);

  scene.add(hemi);

  const sun =
    new T.DirectionalLight(0xffb45e, 4.2);

  sun.position.set(
    -300,
    450,
    180
  );

  sun.castShadow = true;

  sun.shadow.mapSize.set(1024,1024);

  sun.shadow.camera.left =
    -900;

  sun.shadow.camera.right =
    900;

  sun.shadow.camera.top =
    900;

  sun.shadow.camera.bottom =
    -900;

  sun.shadow.camera.near =
    10;

  sun.shadow.camera.far =
    1500;

  scene.add(sun);

  const rim =
    new T.DirectionalLight(0x36d9ff, 1.15);

  rim.position.set(
    500,
    180,
    -500
  );

  scene.add(rim);

  clock =
    new T.Clock();

  /*
  =========================================
  INPUT
  =========================================
  */

  input =
    new InputController();

  input.bind();

  /*
  =========================================
  MAP
  =========================================
  */

  map =
    new WorldMap(
      T,
      CONFIG
    );

  scene.add(
    map.build()
  );

  /*
  =========================================
  PLAYER
  =========================================
  */

  player =
    new PlayerController(
      T,
      CONFIG,
      input,
      map
    );

  /*
  IMPORTANT:
  player body is NOT added to scene.
  Only first-person camera is visible.
  */

  /*
  =========================================
  AUDIO
  =========================================
  */

  audio =
    new AudioSystem();

  /*
  =========================================
  WEAPONS
  =========================================
  */

  weapons =
    new WeaponSystem(
      T,
      WEAPONS,
      player,
      ui,
      audio
    );

  /*
  =========================================
  BOTS
  =========================================
  */

  bots =
    new BotManager(
      T,
      CONFIG,
      map,
      player,
      null,
      ui
    );

  // Hide combatants while the player is in the starting lobby.
  bots.bots.forEach(bot => { bot.object.visible = false; });

  bots.onAllDead =
    () => {

      if (running) {
        finishMatch(true);
      }

    };

  /*
  =========================================
  LOOT
  =========================================
  */

  loot =
    new LootSystem(
      T,
      map,
      player,
      ui,
      weapons
    );

  loot.spawn(140);

  battleRoyale = new BattleRoyaleSystem(T, scene, player, map, ui, input, CONFIG);

  /*
  =========================================
  SAFE ZONE
  =========================================
  */

  ui.scene = scene;

  zone =
    new SafeZone(
      T,
      CONFIG,
      player,
      ui
    );

  /*
  =========================================
  NETWORK
  =========================================
  */

  network =
    new NetworkClient(
      CONFIG,
      ui
    );

  multiplayerAvatars = new MultiplayerAvatars(T, scene, network, player);

  /*
  =========================================
  MATCH
  =========================================
  */

  match =
    new MatchState(
      ui
    );

  /*
  =========================================
  MINIMAP
  =========================================
  */

  const mini =
    $("minimap");

  if (mini) {
    minimap =
      new Minimap(
        mini,
        CONFIG.world.size
      );
  }

  /*
  =========================================
  DEBUG
  =========================================
  */

  debug =
    new DebugTools(
      CONFIG,
      {
        player,
        bots,
        zone,
        network,

        restart() {
          location.reload();
        }
      }
    );

  window.addEventListener(
    "resize",
    resize
  );

  // Starting lobby camera: show the actual playable character in the 3D world.
  player.setCameraMode("TPP");
  player.character.visible = true;
  camera.position.set(
    player.object.position.x + 7.5,
    4.2,
    player.object.position.z + 7.5
  );
  camera.lookAt(
    player.object.position.x,
    1.25,
    player.object.position.z
  );

  initialized = true;

  window.__LAST_ALIVE_GAME_INITIALIZED =
    true;

  console.log(
    "LAST ALIVE ENGINE INITIALIZED"
  );
}

function startMatch() {

  if (
    starting ||
    running
  ) {
    return;
  }

  starting = true;

  try {

    if (!initialized) {

      status(
        "BUILDING DISTRICT 09..."
      );

      initGame();

    }

    const inputName =
      $("playerName");

    const name =
      inputName?.value.trim() ||
      "PLAYER";

    audio.start();

    /*
    RESET PLAYER
    */

    player.hp = 100;
    lastPlayerHP = 100;
    player.armor = 75;
    player.kills = 0;
    player.alive = true;
    player.stamina = 100;
    player.cameraMode = "FPP";
    player.setCameraMode("FPP");
    battleRoyale?.start();
    bots.bots.forEach(bot => {
      bot.object.visible = false;
      bot.alive = true;
      bot.hp = 100;
      bot.armor = 50;
    });
    bots.relocateAroundPlayer?.();

    player.yaw =
      0;

    player.pitch =
      -0.04;

    /*
    RESET WEAPON
    */

    weapons.switch(0);

    /*
    MATCH
    */

    match.begin();

    player.applyLoadout?.(window.__LA_CHARACTER||0, window.__LA_OUTFIT||0);
    ui.start(name);

    running = true;

    window.__LAST_ALIVE_MATCH_RUNNING =
      true;

    /*
    NETWORK
    */

    try {
      network.connect(name);
    } catch (e) {
      console.warn(
        "Network unavailable:",
        e
      );
    }

    /*
    POINTER LOCK
    */

    if (
      window.innerWidth > 700
    ) {

      setTimeout(() => {

        $("game")
          ?.requestPointerLock?.();

      }, 150);

    }

    clock.start();

    ui.hp(player.hp);
    ui.armor(player.armor);

    ui.alive(
      bots.alive() + 1 + (network?.remotePlayers?.size || 0)
    );

    ui.compass?.(player.yaw);
    ui.scope?.(player.cameraMode==="FPP" && input.isAim(), weapons.current);
    ui.toast("V = FPP / TPP · SURVIVE THE DISTRICT");

    ui.weapon(
      weapons.current,
      false
    );
    ui.setWeaponIndex?.(weapons.index);

    status(
      "MATCH LIVE · SURVIVE"
    );

  } catch (e) {

    running = false;

    window.__LAST_ALIVE_MATCH_RUNNING =
      false;

    errorScreen(
      e?.message ||
      "Match failed"
    );

  } finally {

    starting = false;

  }
}

function finishMatch(win) {

  if (!running) {
    return;
  }

  running = false;

  window.__LAST_ALIVE_MATCH_RUNNING =
    false;

  document.exitPointerLock?.();

  const alive =
    bots?.alive() || 0;

  const place =
    win
      ? 1
      : Math.max(
          2,
          alive + 1
        );

  match.end(
    win,
    player.kills,
    place
  );
}

function restart() {
  location.reload();
}

function bindUI() {

  const play =
    $("playBtn");

  if (!play) {
    throw new Error(
      "playBtn not found"
    );
  }

  play.addEventListener(
    "click",
    e => {

      e.preventDefault();

      startMatch();

    }
  );

  // Operator customization in the starting lobby.
  window.__LA_CHARACTER=0;
  window.__LA_OUTFIT=0;
  const loadoutName=$("loadoutName");
  const statusEl=$("loadoutStatus");
  const updateLoadout=()=>{
    if(player && typeof player.applyLoadout==="function"){ player.applyLoadout(window.__LA_CHARACTER,window.__LA_OUTFIT); }
    const names=["NOVA","RAVEN","KAI","VEX"];
    const clothes=["TACTICAL","URBAN","DESERT","NIGHT"];
    if(loadoutName) loadoutName.textContent=names[window.__LA_CHARACTER]+" // "+clothes[window.__LA_OUTFIT];
    if(statusEl) statusEl.textContent="READY TO DEPLOY";
  };
  document.querySelectorAll("[data-character]").forEach(btn=>{
    btn.addEventListener("click",e=>{
      e.preventDefault();
      window.__LA_CHARACTER=Number(btn.dataset.character)||0;
      document.querySelectorAll("[data-character]").forEach(x=>x.classList.toggle("active",x===btn));
      if(!initialized) initGame();
      updateLoadout();
    });
  });
  document.querySelectorAll("[data-outfit]").forEach(btn=>{
    btn.addEventListener("click",e=>{
      e.preventDefault();
      window.__LA_OUTFIT=Number(btn.dataset.outfit)||0;
      document.querySelectorAll("[data-outfit]").forEach(x=>x.classList.toggle("active",x===btn));
      if(!initialized) initGame();
      updateLoadout();
    });
  });
  const name =
    $("playerName");

  name?.addEventListener(
    "keydown",
    e => {

      if (
        e.key === "Enter"
      ) {
        e.preventDefault();
        startMatch();
      }

    }
  );

  $("againBtn")
    ?.addEventListener(
      "click",
      restart
    );

  $("lobbyBtn")
    ?.addEventListener(
      "click",
      () => {

        running = false;

        window.__LAST_ALIVE_MATCH_RUNNING =
          false;

        document.exitPointerLock?.();

        ui.lobby();

      }
    );

  /*
  WEAPON SWITCH
  */

  window.addEventListener(
    "keydown",
    e => {

      if (!running) return;

      const n =
        Number(
          e.key
        );

      if (
        n >= 1 &&
        n <= 6
      ) {

        weapons.switch(
          n - 1
        );

      }

      if (
        e.code === "KeyR"
      ) {

        weapons.reload();

      }

    }
  );

  /*
  POINTER LOCK
  */

  $("game")
    ?.addEventListener(
      "click",
      () => {

        if (!running) return;

        $("game")
          ?.requestPointerLock?.();

      }
    );
}

function resize() {

  if (
    !camera ||
    !renderer
  ) {
    return;
  }

  camera.aspect =
    window.innerWidth /
    window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
}

function loop() {

  requestAnimationFrame(
    loop
  );

  if (
    !renderer ||
    !clock
  ) {
    return;
  }

  const dt =
    Math.min(
      clock.getDelta(),
      0.05
    );

  if (!running && initialized && camera && player) {
    // Slow cinematic orbit while waiting in the starting lobby.
    const t = performance.now() * 0.00018;
    const r = 7.5;
    camera.position.set(
      player.object.position.x + Math.cos(t) * r,
      3.6,
      player.object.position.z + Math.sin(t) * r
    );
    camera.lookAt(
      player.object.position.x,
      1.2,
      player.object.position.z
    );
    player.character.rotation.y = -t + Math.PI * 0.25;
  }

  if (running) {

    player.update(dt);

    if(input.consumeCameraToggle()){
      const mode=player.setCameraMode(player.cameraMode==="FPP"?"TPP":"FPP");
      ui.toast(mode+" CAMERA");
    }

    const mobileWeapon=input.consumeWeaponSlot?.();
    if(mobileWeapon>=0) weapons.switch(mobileWeapon);

    if(input.consumeReload?.()) weapons.reload();

    battleRoyale?.update(dt, bots);

    // Reveal the combatants only after the drop/landing phase.
    if (battleRoyale && !battleRoyale.dropActive) {
      for (const bot of bots.bots) {
        if (bot.alive) bot.object.visible = true;
      }
    }

    multiplayerAvatars?.update();

    /*
    FIRST PERSON CAMERA
    */

    player.cameraUpdate(
      camera,
      dt
    );
    ui.scope?.(player.cameraMode==="FPP" && input.isAim(), weapons.current);

    /*
    FIRE
    */

    if (
      input.fire
    ) {

      weapons.shoot(
        scene,
        camera,
        bots.bots
      );

    }

    weapons.update();

    bots.update(dt);
    // Keep enemy silhouettes rendered above distant scene geometry.
    for (const bot of bots.bots) {
      if (!bot.alive) continue;
      bot.object.renderOrder = 8;
      bot.object.traverse(child => {
        if (child.material) {
          child.renderOrder = 8;
        }
      });
    }

    loot.update(dt);

    zone.update(dt);

    /*
    PLAYER DEATH
    */

    if (
      !player.alive
    ) {

      finishMatch(false);

    }

    /*
    HUD
    */

    ui.hp(
      player.hp
    );

    ui.armor(
      player.armor
    );

    ui.compass?.(player.yaw);
    ui.scope?.(player.cameraMode==="FPP" && input.isAim(), weapons.current);

    ui.alive((battleRoyale?.dropActive ? 50 : bots.alive() + 1) + (network?.remotePlayers?.size || 0));

    /*
    MINIMAP
    */

    if (minimap) {

      minimap.draw(
        player,
        bots.bots,
        zone.radius,
        loot.items
      );

    }

    /*
    NETWORK
    */

    network?.sendState?.({
      x:
        player.object.position.x,

      y:
        player.object.position.y,

      z:
        player.object.position.z,

      yaw:
        player.yaw,

      pitch:
        player.pitch,

      hp:
        player.hp
    });

    debug?.update?.(
      Math.round(
        1 / Math.max(dt, 0.001)
      )
    );

  }

  renderer.render(
    scene,
    camera
  );
}

try {

  window.__LA_CHARACTER=window.__LA_CHARACTER||0;
window.__LA_OUTFIT=window.__LA_OUTFIT||0;
bindUI();

  window.__LAST_ALIVE_READY =
    true;

  status(
    "SYSTEM READY · ENGINE ONLINE"
  );

} catch (e) {

  console.error(e);

  status(
    "ENGINE ERROR · " +
      e.message,
    true
  );

}

loop();
