import { CONFIG, WEAPONS } from "./config.js";
import { InputController } from "./input.js";
import { WorldMap } from "./map.js";
import { PlayerController } from "./player.js";
import { WeaponSystem } from "./weapons.js";
import { BotManager } from "./bots.js";
import { LootSystem } from "./loot.js";
import { SafeZone } from "./zone.js";
import { AudioSystem } from "./audio.js";
import { UI } from "./ui.js";
import { Minimap } from "./minimap.js";
import { NetworkClient } from "./network.js";
import { MatchState } from "./match.js";
import { DebugTools } from "./debug.js";

/*
=========================================================
 LAST ALIVE
 Main Game Controller
=========================================================
*/

const T = window.THREE;

let scene = null;
let camera = null;
let renderer = null;
let clock = null;

let input = null;
let map = null;
let player = null;
let weapons = null;
let bots = null;
let loot = null;
let zone = null;
let audio = null;
let network = null;
let match = null;
let minimap = null;
let debug = null;

let initialized = false;
let running = false;
let starting = false;

const ui = new UI();

/*
=========================================================
 BASIC DOM HELPERS
=========================================================
*/

const $ = id => document.getElementById(id);

function showError(message) {
  console.error("LAST ALIVE ERROR:", message);

  const toast = $("toast");

  if (toast) {
    toast.textContent = "ERROR: " + message;
    toast.style.opacity = "1";

    setTimeout(() => {
      toast.style.opacity = "0";
    }, 5000);
  }

  const menu = $("menu");

  if (menu) {
    menu.classList.remove("hidden");
  }

  const hud = $("hud");

  if (hud) {
    hud.classList.add("hidden");
  }

  const mobile = $("mobileControls");

  if (mobile) {
    mobile.classList.add("hidden");
  }
}

/*
=========================================================
 INITIAL THREE CHECK
=========================================================
*/

if (!T) {
  console.error(
    "Three.js failed to load. Check the CDN in index.html."
  );
}

/*
=========================================================
 INITIAL UI BIND
=========================================================
*/

ui.bind();

/*
=========================================================
 GAME INITIALIZATION
=========================================================
*/

function initGame() {

  if (initialized) {
    return true;
  }

  if (!T) {
    throw new Error(
      "Three.js failed to load. Check index.html."
    );
  }

  /*
  -------------------------------------------------------
  SCENE
  -------------------------------------------------------
  */

  scene = new T.Scene();

  scene.background =
    new T.Color(0x708982);

  scene.fog =
    new T.FogExp2(
      0x344d47,
      0.002
    );

  /*
  -------------------------------------------------------
  CAMERA
  -------------------------------------------------------
  */

  camera =
    new T.PerspectiveCamera(
      70,
      window.innerWidth /
        window.innerHeight,
      0.05,
      1400
    );

  /*
  -------------------------------------------------------
  RENDERER
  -------------------------------------------------------
  */

  const canvas = $("game");

  if (!canvas) {
    throw new Error(
      "Game canvas #game missing."
    );
  }

  renderer =
    new T.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance"
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
    1.1;

  renderer.shadowMap.enabled = true;

  renderer.shadowMap.type =
    T.PCFSoftShadowMap;

  clock = new T.Clock();

  /*
  -------------------------------------------------------
  LIGHTING
  -------------------------------------------------------
  */

  const hemi =
    new T.HemisphereLight(
      0xd5eee5,
      0x203128,
      2.1
    );

  scene.add(hemi);

  const sun =
    new T.DirectionalLight(
      0xffe8c2,
      3.2
    );

  sun.position.set(
    -180,
    260,
    100
  );

  sun.castShadow = true;

  sun.shadow.mapSize.set(
    1024,
    1024
  );

  sun.shadow.camera.left = -500;
  sun.shadow.camera.right = 500;
  sun.shadow.camera.top = 500;
  sun.shadow.camera.bottom = -500;

  scene.add(sun);

  /*
  -------------------------------------------------------
  INPUT
  -------------------------------------------------------
  */

  input =
    new InputController();

  input.bind();

  /*
  -------------------------------------------------------
  MAP
  -------------------------------------------------------
  */

  map =
    new WorldMap(
      T,
      CONFIG
    );

  const mapRoot =
    map.build();

  if (!mapRoot) {
    throw new Error(
      "Map failed to build."
    );
  }

  scene.add(mapRoot);

  /*
  -------------------------------------------------------
  PLAYER
  -------------------------------------------------------
  */

  player =
    new PlayerController(
      T,
      CONFIG,
      input,
      map
    );

  if (!player.object) {
    throw new Error(
      "Player failed to initialize."
    );
  }

  scene.add(
    player.object
  );

  /*
  -------------------------------------------------------
  UI SCENE
  -------------------------------------------------------
  */

  ui.scene = scene;

  /*
  -------------------------------------------------------
  AUDIO
  -------------------------------------------------------
  */

  audio =
    new AudioSystem();

  /*
  -------------------------------------------------------
  WEAPONS
  -------------------------------------------------------
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
  -------------------------------------------------------
  BOTS
  -------------------------------------------------------
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

  bots.onAllDead = () => {
    if (running) {
      finishMatch(true);
    }
  };

  /*
  -------------------------------------------------------
  LOOT
  -------------------------------------------------------
  */

  loot =
    new LootSystem(
      T,
      map,
      player,
      ui,
      weapons
    );

  loot.spawn(30);

  /*
  -------------------------------------------------------
  SAFE ZONE
  -------------------------------------------------------
  */

  zone =
    new SafeZone(
      T,
      CONFIG,
      player,
      ui
    );

  /*
  -------------------------------------------------------
  NETWORK
  -------------------------------------------------------
  */

  network =
    new NetworkClient(
      CONFIG,
      ui
    );

  /*
  -------------------------------------------------------
  MATCH
  -------------------------------------------------------
  */

  match =
    new MatchState(
      ui
    );

  /*
  -------------------------------------------------------
  MINIMAP
  -------------------------------------------------------
  */

  const minimapCanvas =
    $("minimap");

  if (minimapCanvas) {

    minimap =
      new Minimap(
        minimapCanvas,
        CONFIG.world.size
      );

  }

  /*
  -------------------------------------------------------
  DEBUG
  -------------------------------------------------------
  */

  debug =
    new DebugTools(
      CONFIG,
      {
        player,
        bots,
        zone,
        network,

        restart: () => {
          restart();
        }
      }
    );

  /*
  -------------------------------------------------------
  RESIZE
  -------------------------------------------------------
  */

  window.addEventListener(
    "resize",
    resize
  );

  initialized = true;

  console.log(
    "LAST ALIVE GAME INITIALIZED"
  );

  return true;
}

/*
=========================================================
 START MATCH
=========================================================
*/

function startMatch() {

  if (starting || running) {
    return;
  }

  starting = true;

  console.log(
    "ENTER MATCH CLICKED"
  );

  try {

    /*
    -----------------------------------------------------
    INITIALIZE ONLY NOW
    -----------------------------------------------------
    */

    if (!initialized) {
      initGame();
    }

    /*
    -----------------------------------------------------
    PLAYER NAME
    -----------------------------------------------------
    */

    const nameInput =
      $("playerName");

    const playerName =
      nameInput?.value.trim() ||
      "PLAYER";

    /*
    -----------------------------------------------------
    AUDIO
    -----------------------------------------------------
    */

    try {
      audio?.start();
    } catch (audioError) {
      console.warn(
        "Audio unavailable:",
        audioError
      );
    }

    /*
    -----------------------------------------------------
    RESET PLAYER
    -----------------------------------------------------
    */

    if (player) {

      player.hp = 100;
      player.armor = 75;
      player.kills = 0;
      player.alive = true;
      player.stamina = 100;
      player.vy = 0;
      player.grounded = true;

      player.object.position.set(
        0,
        0,
        120
      );

      player.yaw = 0;
      player.pitch = -0.08;
    }

    /*
    -----------------------------------------------------
    MATCH STATE
    -----------------------------------------------------
    */

    match.begin();

    /*
    -----------------------------------------------------
    UI
    -----------------------------------------------------
    */

    ui.start(
      playerName
    );

    /*
    -----------------------------------------------------
    RUNNING
    -----------------------------------------------------
    */

    running = true;

    /*
    -----------------------------------------------------
    NETWORK
    -----------------------------------------------------
    */

    if (
      network &&
      CONFIG.network &&
      CONFIG.network.enabled
    ) {

      try {

        network.connect(
          playerName
        );

      } catch (networkError) {

        console.warn(
          "Network unavailable. Continuing local match.",
          networkError
        );

      }

    }

    /*
    -----------------------------------------------------
    POINTER LOCK
    -----------------------------------------------------
    */

    if (
      window.innerWidth > 700
    ) {

      const canvas =
        $("game");

      setTimeout(() => {

        canvas?.requestPointerLock?.();

      }, 100);

    }

    /*
    -----------------------------------------------------
    CLOCK
    -----------------------------------------------------
    */

    clock.start();

    /*
    -----------------------------------------------------
    HUD INITIAL VALUES
    -----------------------------------------------------
    */

    ui.hp(
      player.hp
    );

    ui.armor(
      player.armor
    );

    ui.alive(
      bots.alive() + 1
    );

    ui.weapon(
      weapons.current,
      false
    );

    console.log(
      "MATCH STARTED"
    );

  } catch (error) {

    running = false;

    console.error(
      "MATCH START ERROR:",
      error
    );

    showError(
      error?.message ||
      "Unable to start match."
    );

  } finally {

    starting = false;

  }
}

/*
=========================================================
 BIND UI
=========================================================
*/

function bindUI() {

  const playButton =
    $("playBtn");

  const againButton =
    $("againBtn");

  const lobbyButton =
    $("lobbyBtn");

  /*
  -------------------------------------------------------
  ENTER MATCH
  -------------------------------------------------------
  */

  if (playButton) {

    playButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        startMatch();

      }
    );

  } else {

    console.error(
      "playBtn not found."
    );

  }

  /*
  -------------------------------------------------------
  ENTER KEY
  -------------------------------------------------------
  */

  const nameInput =
    $("playerName");

  if (nameInput) {

    nameInput.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          startMatch();

        }

      }
    );

  }

  /*
  -------------------------------------------------------
  PLAY AGAIN
  -------------------------------------------------------
  */

  if (againButton) {

    againButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        restart();

      }
    );

  }

  /*
  -------------------------------------------------------
  RETURN TO LOBBY
  -------------------------------------------------------
  */

  if (lobbyButton) {

    lobbyButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        running = false;

        document
          .exitPointerLock?.();

        if (ui.lobby) {
          ui.lobby();
        } else {
          window.location.reload();
        }

      }
    );

  }

  /*
  -------------------------------------------------------
  KEYBOARD
  -------------------------------------------------------
  */

  window.addEventListener(
    "keydown",
    event => {

      if (!running) {
        return;
      }

      if (
        event.code === "KeyR"
      ) {

        weapons.reload();

      }

      if (
        event.code === "Digit1"
      ) {

        weapons.switch(0);

      }

      if (
        event.code === "Digit2"
      ) {

        weapons.switch(1);

      }

      if (
        event.code === "Digit3"
      ) {

        weapons.switch(2);

      }

    }
  );

  /*
  -------------------------------------------------------
  POINTER LOCK
  -------------------------------------------------------
  */

  const canvas =
    $("game");

  if (canvas) {

    canvas.addEventListener(
      "click",
      () => {

        if (!running) {
          return;
        }

        if (
          window.innerWidth <= 700
        ) {
          return;
        }

        if (
          document.pointerLockElement !==
          canvas
        ) {

          canvas.requestPointerLock?.();

        }

      }
    );

  }
}

/*
=========================================================
 FINISH MATCH
=========================================================
*/

function finishMatch(won) {

  if (!running) {
    return;
  }

  running = false;

  document
    .exitPointerLock?.();

  const aliveBots =
    bots
      ? bots.alive()
      : 0;

  const placement =
    won
      ? 1
      : Math.max(
          2,
          aliveBots + 1
        );

  match?.end(
    won,
    player?.kills || 0,
    placement
  );
}

/*
=========================================================
 RESTART
=========================================================
*/

function restart() {

  window.location.reload();

}

/*
=========================================================
 RESIZE
=========================================================
*/

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

/*
=========================================================
 GAME LOOP
=========================================================
*/

function gameLoop() {

  requestAnimationFrame(
    gameLoop
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

  if (running) {

    /*
    -----------------------------------------------------
    PLAYER
    -----------------------------------------------------
    */

    player?.update(
      dt
    );

    /*
    -----------------------------------------------------
    SHOOTING
    -----------------------------------------------------
    */

    if (
      input?.fire &&
      weapons
    ) {

      weapons.shoot(
        scene,
        camera,
        bots?.bots || []
      );

    }

    /*
    -----------------------------------------------------
    WEAPON
    -----------------------------------------------------
    */

    weapons?.update();

    /*
    -----------------------------------------------------
    BOTS
    -----------------------------------------------------
    */

    bots?.update(
      dt
    );

    /*
    -----------------------------------------------------
    LOOT
    -----------------------------------------------------
    */

    loot?.update(
      dt
    );

    /*
    -----------------------------------------------------
    ZONE
    -----------------------------------------------------
    */

    zone?.update(
      dt
    );

    /*
    -----------------------------------------------------
    HUD
    -----------------------------------------------------
    */

    if (player) {

      ui.hp(
        player.hp
      );

      ui.armor(
        player.armor
      );

    }

    if (bots) {

      ui.alive(
        bots.alive() + 1
      );

    }

    /*
    -----------------------------------------------------
    MINIMAP
    -----------------------------------------------------
    */

    if (
      minimap &&
      player &&
      bots &&
      zone
    ) {

      minimap.draw(
        player,
        bots.bots,
        zone.radius,
        loot?.items || []
      );

    }

    /*
    -----------------------------------------------------
    DEBUG
    -----------------------------------------------------
    */

    if (debug) {

      const fps =
        Math.round(
          1 /
          Math.max(
            dt,
            0.001
          )
        );

      debug.update(
        fps
      );

    }

    /*
    -----------------------------------------------------
    PLAYER DEATH
    -----------------------------------------------------
    */

    if (
      player &&
      !player.alive
    ) {

      finishMatch(
        false
      );

    }

    /*
    -----------------------------------------------------
    BOT VICTORY
    -----------------------------------------------------
    */

    if (
      bots &&
      bots.alive() === 0
    ) {

      finishMatch(
        true
      );

    }

  }

  /*
  -------------------------------------------------------
  FIRST PERSON CAMERA
  -------------------------------------------------------
  */

  if (
    player &&
    camera
  ) {

    player.cameraUpdate(
      camera,
      true
    );

  }

  /*
  -------------------------------------------------------
  RENDER
  -------------------------------------------------------
  */

  renderer.render(
    scene,
    camera
  );
}

/*
=========================================================
 BOOT
=========================================================
*/

try {

  /*
  IMPORTANT:
  UI BUTTON IS BOUND FIRST.
  GAME DOES NOT INITIALIZE UNTIL ENTER MATCH.
  */

  bindUI();

  console.log(
    "LAST ALIVE UI READY"
  );

} catch (error) {

  console.error(
    "UI BIND ERROR:",
    error
  );

}

/*
=========================================================
 START RENDER LOOP
=========================================================
*/

requestAnimationFrame(
  gameLoop
);
