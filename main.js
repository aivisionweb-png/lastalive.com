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

let initialized = false;
let running = false;
let starting = false;

const ui = new UI();

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

  scene.background =
    new T.Color(
      0x536c69
    );

  scene.fog =
    new T.Fog(
      0x536c69,
      260,
      1450
    );

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

  renderer.shadowMap.enabled =
    true;

  renderer.shadowMap.type =
    T.PCFSoftShadowMap;

  /*
  =========================================
  LIGHTING
  =========================================
  */

  const hemi =
    new T.HemisphereLight(
      0xd9eee8,
      0x18241f,
      2.2
    );

  scene.add(hemi);

  const sun =
    new T.DirectionalLight(
      0xffe3bd,
      3.6
    );

  sun.position.set(
    -300,
    450,
    180
  );

  sun.castShadow = true;

  sun.shadow.mapSize.set(
    2048,
    2048
  );

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
    new T.DirectionalLight(
      0x72b9c4,
      0.7
    );

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

  loot.spawn(100);

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
    player.armor = 75;
    player.kills = 0;
    player.alive = true;
    player.stamina = 100;

    player.object.position.set(
      0,
      0,
      650
    );

    player.yaw =
      Math.PI;

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
      bots.alive() + 1
    );

    ui.weapon(
      weapons.current,
      false
    );

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

  if (running) {

    player.update(dt);

    /*
    FIRST PERSON CAMERA
    */

    player.cameraUpdate(
      camera,
      dt
    );

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

    ui.alive(
      bots.alive() + 1
    );

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
