/*
=========================================================
 LAST ALIVE
 ROBUST BOOT LOADER
=========================================================
*/

(() => {

  "use strict";

  const status =
    document.getElementById("bootStatus");

  window.__LAST_ALIVE_READY = false;
  window.__LAST_ALIVE_BOOT_ERROR = null;

  /*
  =======================================================
  STATUS
  =======================================================
  */

  function setStatus(
    message,
    error = false
  ) {

    if (!status) {
      return;
    }

    status.textContent =
      message;

    status.classList.toggle(
      "error",
      error
    );
  }

  /*
  =======================================================
  LOAD SCRIPT
  =======================================================
  */

  function loadScript(
    src,
    timeout = 10000
  ) {

    return new Promise(
      (resolve, reject) => {

        const script =
          document.createElement("script");

        let finished = false;

        const timer =
          setTimeout(
            () => {

              if (finished) {
                return;
              }

              finished = true;

              script.remove();

              reject(
                new Error(
                  "Timeout loading " + src
                )
              );

            },
            timeout
          );

        script.src =
          src;

        script.async =
          false;

        script.onload =
          () => {

            if (finished) {
              return;
            }

            finished = true;

            clearTimeout(
              timer
            );

            resolve();

          };

        script.onerror =
          () => {

            if (finished) {
              return;
            }

            finished = true;

            clearTimeout(
              timer
            );

            script.remove();

            reject(
              new Error(
                "Failed loading " + src
              )
            );

          };

        document.head.appendChild(
          script
        );

      }
    );

  }

  /*
  =======================================================
  THREE.JS
  =======================================================
  */

  async function loadThree() {

    if (window.THREE) {

      console.log(
        "LAST ALIVE: Three.js already loaded",
        window.THREE.REVISION
      );

      return true;

    }

    const sources = [

      "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.min.js",

      "https://unpkg.com/three@0.170.0/build/three.min.js"

    ];

    for (
      const source of sources
    ) {

      try {

        setStatus(
          "SYSTEM BOOTING · LOADING 3D ENGINE..."
        );

        console.log(
          "LAST ALIVE: Loading Three.js:",
          source
        );

        await loadScript(
          source
        );

        if (window.THREE) {

          console.log(
            "LAST ALIVE: Three.js ONLINE · r" +
            window.THREE.REVISION
          );

          return true;

        }

      } catch (error) {

        console.warn(
          "Three.js source failed:",
          source,
          error
        );

      }

    }

    throw new Error(
      "Three.js failed to load from all CDNs"
    );
  }

  /*
  =======================================================
  SOCKET.IO
  =======================================================
  */

  async function loadSocketIO() {

    if (
      typeof window.io ===
      "function"
    ) {

      console.log(
        "LAST ALIVE: Socket.IO already loaded"
      );

      return true;

    }

    const sources = [

      "https://cdn.socket.io/4.8.1/socket.io.min.js",

      "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.1/socket.io.min.js"

    ];

    for (
      const source of sources
    ) {

      try {

        console.log(
          "LAST ALIVE: Loading Socket.IO:",
          source
        );

        await loadScript(
          source
        );

        if (
          typeof window.io ===
          "function"
        ) {

          console.log(
            "LAST ALIVE: Socket.IO ONLINE"
          );

          return true;

        }

      } catch (error) {

        console.warn(
          "Socket.IO source failed:",
          source,
          error
        );

      }

    }

    /*
    Socket.IO is optional.
    The local game should still work.
    */

    console.warn(
      "LAST ALIVE: Socket.IO unavailable. Local mode enabled."
    );

    return false;
  }

  /*
  =======================================================
  LOAD MAIN GAME
  =======================================================
  */

  async function loadMain() {

    setStatus(
      "SYSTEM BOOTING · LOADING GAME SYSTEMS..."
    );

    console.log(
      "LAST ALIVE: importing main.js"
    );

    await import(
      "./main.js"
    );

    console.log(
      "LAST ALIVE: main.js imported"
    );

  }

  /*
  =======================================================
  ERROR HANDLER
  =======================================================
  */

  function fail(
    error
  ) {

    const message =
      error?.message ||
      String(error) ||
      "Unknown startup error";

    window.__LAST_ALIVE_READY =
      false;

    window.__LAST_ALIVE_BOOT_ERROR =
      message;

    console.error(
      "===================================="
    );

    console.error(
      "LAST ALIVE BOOT FAILURE"
    );

    console.error(
      message
    );

    console.error(
      "===================================="
    );

    setStatus(
      "ENGINE ERROR · " +
      message,
      true
    );

  }

  /*
  =======================================================
  BOOT
  =======================================================
  */

  async function boot() {

    try {

      setStatus(
        "SYSTEM BOOTING · INITIALIZING..."
      );

      /*
      -----------------------------------------------
      THREE
      -----------------------------------------------
      */

      await loadThree();

      /*
      -----------------------------------------------
      SOCKET.IO
      -----------------------------------------------
      */

      await loadSocketIO();

      /*
      -----------------------------------------------
      MAIN
      -----------------------------------------------
      */

      await loadMain();

      /*
      -----------------------------------------------
      WAIT FOR MAIN READY
      -----------------------------------------------
      */

      const started =
        performance.now();

      const checkReady =
        () => {

          if (
            window.__LAST_ALIVE_READY
          ) {

            setStatus(
              "SYSTEM READY · ENGINE ONLINE"
            );

            console.log(
              "===================================="
            );

            console.log(
              "LAST ALIVE READY"
            );

            console.log(
              "THREE:",
              window.THREE?.REVISION
            );

            console.log(
              "===================================="
            );

            return;

          }

          if (
            performance.now() -
            started >
            6000
          ) {

            fail(
              new Error(
                "Game engine did not become ready"
              )
            );

            return;

          }

          requestAnimationFrame(
            checkReady
          );

        };

      checkReady();

    } catch (error) {

      fail(
        error
      );

    }

  }

  /*
  =======================================================
  GLOBAL ERRORS
  =======================================================
  */

  window.addEventListener(
    "error",
    event => {

      console.error(
        "LAST ALIVE GLOBAL ERROR:",
        event.error ||
        event.message
      );

    }
  );

  window.addEventListener(
    "unhandledrejection",
    event => {

      console.error(
        "LAST ALIVE PROMISE ERROR:",
        event.reason
      );

    }
  );

  /*
  =======================================================
  START
  =======================================================
  */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {
        once: true
      }
    );

  } else {

    boot();

  }

})();
