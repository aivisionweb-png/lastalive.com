/*
=========================================================
 LAST ALIVE
 ROBUST BOOT LOADER
=========================================================
*/

(() => {

  "use strict";


  /*
  =======================================================
  STATUS ELEMENT
  =======================================================
  */

  const status =
    document.getElementById(
      "bootStatus"
    );


  /*
  =======================================================
  GLOBAL BOOT STATE
  =======================================================
  */

  window.__LAST_ALIVE_READY =
    false;

  window.__LAST_ALIVE_BOOT_ERROR =
    null;

  window.__LAST_ALIVE_MAIN_LOADED =
    false;


  /*
  =======================================================
  STATUS UI
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
  GENERIC SCRIPT LOADER
  =======================================================
  */

  function loadScript(
    src,
    timeout = 15000
  ) {

    return new Promise(
      (resolve, reject) => {

        const script =
          document.createElement(
            "script"
          );

        let finished =
          false;


        /*
        -----------------------------------------------
        TIMEOUT
        -----------------------------------------------
        */

        const timer =
          setTimeout(
            () => {

              if (finished) {
                return;
              }

              finished =
                true;

              script.remove();

              reject(
                new Error(
                  "Timeout loading " +
                  src
                )
              );

            },
            timeout
          );


        /*
        -----------------------------------------------
        SOURCE
        -----------------------------------------------
        */

        script.src =
          src;

        script.async =
          false;


        /*
        -----------------------------------------------
        SUCCESS
        -----------------------------------------------
        */

        script.onload =
          () => {

            if (finished) {
              return;
            }

            finished =
              true;

            clearTimeout(
              timer
            );

            resolve();

          };


        /*
        -----------------------------------------------
        FAILURE
        -----------------------------------------------
        */

        script.onerror =
          () => {

            if (finished) {
              return;
            }

            finished =
              true;

            clearTimeout(
              timer
            );

            script.remove();

            reject(
              new Error(
                "Failed loading " +
                src
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

    /*
    -----------------------------------------------
    ALREADY LOADED
    -----------------------------------------------
    */

    if (
      window.THREE
    ) {

      console.log(
        "LAST ALIVE: Three.js already loaded",
        window.THREE.REVISION
      );

      return true;

    }


    /*
    -----------------------------------------------
    COMPATIBLE THREE.JS BUILD
    -----------------------------------------------

    IMPORTANT:

    Three.js r160+ does not provide the old
    build/three.min.js global build.

    Our current game architecture expects:

        window.THREE

    Therefore we use r159.
    -----------------------------------------------
    */

    const sources = [

      "https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js",

      "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.159.0/three.min.js",

      "https://unpkg.com/three@0.159.0/build/three.min.js"

    ];


    /*
    -----------------------------------------------
    TRY EACH CDN
    -----------------------------------------------
    */

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


        /*
        -------------------------------------------
        VERIFY
        -------------------------------------------
        */

        if (
          window.THREE
        ) {

          console.log(
            "LAST ALIVE: Three.js ONLINE · r" +
            window.THREE.REVISION
          );

          return true;

        }

        console.warn(
          "Three.js script loaded but window.THREE is missing:",
          source
        );

      } catch (
        error
      ) {

        console.warn(
          "Three.js source failed:",
          source,
          error
        );

      }

    }


    /*
    -----------------------------------------------
    ALL FAILED
    -----------------------------------------------
    */

    throw new Error(
      "Three.js failed to load. Compatible engine unavailable."
    );

  }


  /*
  =======================================================
  SOCKET.IO
  =======================================================
  */

  async function loadSocketIO() {

    /*
    -----------------------------------------------
    ALREADY LOADED
    -----------------------------------------------
    */

    if (
      typeof window.io ===
      "function"
    ) {

      console.log(
        "LAST ALIVE: Socket.IO already loaded"
      );

      return true;

    }


    /*
    -----------------------------------------------
    SOCKET.IO SOURCES
    -----------------------------------------------
    */

    const sources = [

      "https://cdn.socket.io/4.8.1/socket.io.min.js",

      "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.1/socket.io.min.js"

    ];


    /*
    -----------------------------------------------
    TRY EACH
    -----------------------------------------------
    */

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

      } catch (
        error
      ) {

        console.warn(
          "Socket.IO source failed:",
          source,
          error
        );

      }

    }


    /*
    -----------------------------------------------
    OPTIONAL NETWORK
    -----------------------------------------------

    The game must still be able to boot in
    local / bot mode if Socket.IO is unavailable.
    -----------------------------------------------
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


    try {

      await import(
        "./main.js"
      );

      window.__LAST_ALIVE_MAIN_LOADED =
        true;


      console.log(
        "LAST ALIVE: main.js imported"
      );

    } catch (
      error
    ) {

      console.error(
        "LAST ALIVE: main.js import failed",
        error
      );

      throw error;

    }

  }


  /*
  =======================================================
  BOOT FAILURE
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
      error
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
  WAIT FOR GAME READY
  =======================================================
  */

  function waitForGameReady() {

    const started =
      performance.now();


    function check() {

      /*
      -----------------------------------------------
      READY
      -----------------------------------------------
      */

      if (
        window.__LAST_ALIVE_READY ===
        true
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
          "MAIN:",
          window.__LAST_ALIVE_MAIN_LOADED
        );

        console.log(
          "===================================="
        );

        return;

      }


      /*
      -----------------------------------------------
      MAIN REPORTED AN ERROR
      -----------------------------------------------
      */

      if (
        window.__LAST_ALIVE_BOOT_ERROR
      ) {

        return;

      }


      /*
      -----------------------------------------------
      TIMEOUT
      -----------------------------------------------
      */

      if (
        performance.now() -
        started >
        8000
      ) {

        fail(
          new Error(
            "Game engine did not become ready"
          )
        );

        return;

      }


      /*
      -----------------------------------------------
      CONTINUE
      -----------------------------------------------
      */

      requestAnimationFrame(
        check
      );

    }


    check();

  }


  /*
  =======================================================
  MAIN BOOT
  =======================================================
  */

  async function boot() {

    try {

      /*
      -----------------------------------------------
      INITIAL STATUS
      -----------------------------------------------
      */

      setStatus(
        "SYSTEM BOOTING · INITIALIZING..."
      );


      /*
      -----------------------------------------------
      THREE.JS
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
      MAIN GAME
      -----------------------------------------------
      */

      await loadMain();


      /*
      -----------------------------------------------
      WAIT FOR MAIN
      -----------------------------------------------
      */

      waitForGameReady();

    } catch (
      error
    ) {

      fail(
        error
      );

    }

  }


  /*
  =======================================================
  GLOBAL ERROR LISTENER
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


  /*
  =======================================================
  UNHANDLED PROMISE LISTENER
  =======================================================
  */

  window.addEventListener(
    "unhandledrejection",
    event => {

      console.error(
        "LAST ALIVE UNHANDLED PROMISE:",
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
