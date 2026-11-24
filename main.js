import {
  CONFIG,
  WEAPONS
} from "./config.js";

import {
  InputController
} from "./input.js";

import {
  WorldMap
} from "./map.js";

import {
  PlayerController
} from "./player.js";

import {
  WeaponSystem
} from "./weapons.js";

import {
  BotManager
} from "./bots.js";

import {
  LootSystem
} from "./loot.js";

import {
  SafeZone
} from "./zone.js";

import {
  AudioSystem
} from "./audio.js";

import {
  UI
} from "./ui.js";

import {
  Minimap
} from "./minimap.js";

import {
  NetworkClient
} from "./network.js";

import {
  MatchState
} from "./match.js";

import {
  DebugTools
} from "./debug.js";


/* =========================================================
   THREE CHECK
========================================================= */

const T = window.THREE;

if (!T) {
  throw new Error(
    "Three.js failed to load. Check index.html CDN."
  );
}


/* =========================================================
   GAME VARIABLES
========================================================= */

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

let running = false;
let initialized = false;


/* =========================================================
   UI
========================================================= */

const ui = new UI();

ui.bind();


/* =========================================================
   INITIALIZE GAME
========================================================= */

function init() {

  if (initialized) {
    return;
  }

  initialized = true;


  /* -------------------------------------------------------
     SCENE
  ------------------------------------------------------- */

  scene = new T.Scene();

  scene.background =
    new T.Color(0x708982);

  scene.fog =
    new T.FogExp2(
      0x344d47,
      0.002
    );


  /* -------------------------------------------------------
     CAMERA
  ------------------------------------------------------- */

  camera =
    new T.PerspectiveCamera(
      70,
      window.innerWidth /
        window.innerHeight,
      0.05,
      1400
    );


  /* -------------------------------------------------------
     RENDERER
  ------------------------------------------------------- */

  const canvas =
    document.getElementById("game");


  renderer =
    new T.WebGLRenderer({
      canvas: canvas,
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
    1.1;


  renderer.shadowMap.enabled =
    true;


  renderer.shadowMap.type =
    T.PCFSoftShadowMap;


  clock =
    new T.Clock();


  /* =======================================================
     LIGHTING
  ======================================================= */

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


  sun.shadow.camera.left =
    -500;

  sun.shadow.camera.right =
    500;

  sun.shadow.camera.top =
    500;

  sun.shadow.camera.bottom =
    -500;


  scene.add(sun);


  /* =======================================================
     INPUT
  ======================================================= */

  input =
    new InputController();

  input.bind();


  /* =======================================================
     MAP
  ======================================================= */

  map =
    new WorldMap(
      T,
      CONFIG
    );


  const mapRoot =
    map.build();


  scene.add(
    mapRoot
  );


  /* =======================================================
     PLAYER
  ======================================================= */

  player =
    new PlayerController(
      T,
      CONFIG,
      input,
      map
    );


  scene.add(
    player.object
  );


  /* =======================================================
     UI SCENE REFERENCE
  ======================================================= */

  ui.scene =
    scene;


  /* =======================================================
     AUDIO
  ======================================================= */

  audio =
    new AudioSystem();


  /* =======================================================
     WEAPONS
  ======================================================= */

  weapons =
    new WeaponSystem(
      T,
      WEAPONS,
      player,
      ui,
      audio
    );


  /* =======================================================
     BOTS
  ======================================================= */

  bots =
    new BotManager(
      T,
      CONFIG,
      map,
      player,
      null,
      ui
    );


  bots.onAllDead =
    () => {
      finishMatch(true);
    };


  /* =======================================================
     LOOT
  ======================================================= */

  loot =
    new LootSystem(
      T,
      map,
      player,
      ui,
      weapons
    );


  loot.spawn(30);


  /* =======================================================
     SAFE ZONE
  ======================================================= */

  zone =
    new SafeZone(
      T,
      CONFIG,
      player,
      ui
    );


  /* =======================================================
     NETWORK
  ======================================================= */

  network =
    new NetworkClient(
      CONFIG,
      ui
    );


  /* =======================================================
     MATCH
  ======================================================= */

  match =
    new MatchState(
      ui
    );


  /* =======================================================
     MINIMAP
  ======================================================= */

  minimap =
    new Minimap(
      document.getElementById(
        "minimap"
      ),
      CONFIG.world.size
    );


  /* =======================================================
     DEBUG
  ======================================================= */

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


  /* =======================================================
     UI EVENTS
  ======================================================= */

  bindUI();


  /* =======================================================
     RESIZE
  ======================================================= */

  window.addEventListener(
    "resize",
    resize
  );


  /* =======================================================
     START LOOP
  ======================================================= */

  requestAnimationFrame(
    gameLoop
  );
}


/* =========================================================
   UI BINDINGS
========================================================= */

function bindUI() {

  const playButton =
    document.getElementById(
      "playBtn"
    );


  const againButton =
    document.getElementById(
      "againBtn"
    );


  const lobbyButton =
    document.getElementById(
      "lobbyBtn"
    );


  const gameCanvas =
    document.getElementById(
      "game"
    );


  /* -------------------------------------------------------
     PLAY
  ------------------------------------------------------- */

  if (playButton) {

    playButton.addEventListener(
      "click",
      startMatch
    );
  }


  /* -------------------------------------------------------
     PLAY AGAIN
  ------------------------------------------------------- */

  if (againButton) {

    againButton.addEventListener(
      "click",
      restart
    );
  }


  /* -------------------------------------------------------
     LOBBY
  ------------------------------------------------------- */

  if (lobbyButton) {

    lobbyButton.addEventListener(
      "click",
      () => {

        window.location.reload();

      }
    );
  }


  /* -------------------------------------------------------
     KEYBOARD
  ------------------------------------------------------- */

  window.addEventListener(
    "keydown",
    event => {

      if (!running) {
        return;
      }


      /* RELOAD */

      if (
        event.code === "KeyR"
      ) {

        weapons.reload();

      }


      /* WEAPON 1 */

      if (
        event.code === "Digit1"
      ) {

        weapons.switch(0);

      }


      /* WEAPON 2 */

      if (
        event.code === "Digit2"
      ) {

        weapons.switch(1);

      }


      /* WEAPON 3 */

      if (
        event.code === "Digit3"
      ) {

        weapons.switch(2);

      }

    }
  );


  /* -------------------------------------------------------
     POINTER LOCK
  ------------------------------------------------------- */

  if (gameCanvas) {

    gameCanvas.addEventListener(
      "click",
      () => {

        if (!running) {
          return;
        }


        /*
          Desktop only.
          Mobile uses touch controls.
        */

        if (
          window.innerWidth <= 700
        ) {
          return;
        }


        if (
          document.pointerLockElement !==
          gameCanvas
        ) {

          gameCanvas.requestPointerLock?.();

        }

      }
    );

  }
}


/* =========================================================
   START MATCH
========================================================= */

function startMatch() {

  if (running) {
    return;
  }


  const nameInput =
    document.getElementById(
      "playerName"
    );


  const playerName =
    nameInput?.value.trim() ||
    "PLAYER";


  try {

    /* AUDIO */

    audio.start();


    /* UI */

    ui.start(
      playerName
    );


    /* MATCH */

    match.begin();


    running = true;


    /* POINTER LOCK */

    if (
      window.innerWidth > 700
    ) {

      document
        .getElementById("game")
        ?.requestPointerLock?.();

    }


    /* NETWORK */

    if (
      network &&
      CONFIG.network.enabled
    ) {

      network.connect(
        playerName
      );

    }


    /* CLOCK */

    clock.start();


  } catch (error) {

    console.error(
      "MATCH START ERROR:",
      error
    );


    running = false;


    alert(
      "Game start error:\n\n" +
      error.message
    );

  }
}


/* =========================================================
   FINISH MATCH
========================================================= */

function finishMatch(
  won
) {

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


  if (match) {

    match.end(
      won,
      player?.kills || 0,
      placement
    );

  }

}


/* =========================================================
   RESTART
========================================================= */

function restart() {

  window.location.reload();

}


/* =========================================================
   RESIZE
========================================================= */

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


/* =========================================================
   MAIN GAME LOOP
========================================================= */

function gameLoop() {

  requestAnimationFrame(
    gameLoop
  );


  if (!renderer) {
    return;
  }


  const dt =
    Math.min(
      clock.getDelta(),
      0.05
    );


  /* =======================================================
     ACTIVE MATCH
  ======================================================= */

  if (running) {


    /* PLAYER */

    if (player) {

      player.update(
        dt
      );

    }


    /* -----------------------------------------------------
       SHOOTING
    ----------------------------------------------------- */

    if (
      input &&
      input.fire
    ) {

      weapons.shoot(
        scene,
        camera,
        bots.bots
      );

    }


    /* -----------------------------------------------------
       WEAPON UPDATE
    ----------------------------------------------------- */

    if (weapons) {

      weapons.update();

    }


    /* -----------------------------------------------------
       BOTS
    ----------------------------------------------------- */

    if (bots) {

      bots.update(
        dt
      );

    }


    /* -----------------------------------------------------
       LOOT
    ----------------------------------------------------- */

    if (loot) {

      loot.update(
        dt
      );

    }


    /* -----------------------------------------------------
       SAFE ZONE
    ----------------------------------------------------- */

    if (zone) {

      zone.update(
        dt
      );

    }


    /* -----------------------------------------------------
       PLAYER HUD
    ----------------------------------------------------- */

    if (player) {

      ui.hp(
        player.hp
      );


      ui.armor(
        player.armor
      );

    }


    /* -----------------------------------------------------
       ALIVE COUNT
    ----------------------------------------------------- */

    if (bots) {

      ui.alive(
        bots.alive() + 1
      );

    }


    /* -----------------------------------------------------
       MINIMAP
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       DEBUG
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       PLAYER DEAD
    ----------------------------------------------------- */

    if (
      player &&
      !player.alive
    ) {

      finishMatch(
        false
      );

    }


    /* -----------------------------------------------------
       ALL BOTS DEAD
    ----------------------------------------------------- */

    if (
      bots &&
      bots.alive() === 0
    ) {

      finishMatch(
        true
      );

    }

  }


  /* =======================================================
     FIRST PERSON CAMERA
  ======================================================= */

  if (
    player &&
    camera
  ) {

    player.cameraUpdate(
      camera,
      true
    );

  }


  /* =======================================================
     RENDER
  ======================================================= */

  renderer.render(
    scene,
    camera
  );

}


/* =========================================================
   SAFE INITIALIZATION
========================================================= */

try {

  init();

} catch (error) {

  console.error(
    "LAST ALIVE INIT ERROR:",
    error
  );


  const menu =
    document.getElementById(
      "menu"
    );


  if (menu) {

    menu.classList.remove(
      "hidden"
    );

  }


  alert(
    "LAST ALIVE failed to start:\n\n" +
    error.message
  );

}
