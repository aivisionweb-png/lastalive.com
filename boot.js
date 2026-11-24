/*
=========================================================
 LAST ALIVE
 BOOT LOADER
=========================================================
*/

(() => {
  "use strict";

  const status = document.getElementById("bootStatus");

  window.__LAST_ALIVE_READY = false;
  window.__LAST_ALIVE_BOOT_ERROR = null;

  function setStatus(message, error = false) {
    if (!status) return;

    status.textContent = message;

    if (error) {
      status.classList.add("error");
    } else {
      status.classList.remove("error");
    }
  }

  function reportError(error) {
    const message =
      error?.message ||
      String(error) ||
      "Unknown startup error";

    window.__LAST_ALIVE_BOOT_ERROR = message;
    window.__LAST_ALIVE_READY = false;

    console.error(
      "===================================="
    );

    console.error(
      "LAST ALIVE BOOT ERROR"
    );

    console.error(
      message
    );

    console.error(
      "===================================="
    );

    setStatus(
      "ENGINE ERROR · " + message,
      true
    );
  }

  async function boot() {
    try {
      setStatus(
        "SYSTEM BOOTING · CHECKING ENGINE..."
      );

      /*
      ---------------------------------------------------
      THREE.JS CHECK
      ---------------------------------------------------
      */

      if (!window.THREE) {
        throw new Error(
          "Three.js failed to load"
        );
      }

      console.log(
        "LAST ALIVE: Three.js detected",
        window.THREE.REVISION
      );

      /*
      ---------------------------------------------------
      SOCKET.IO CHECK
      ---------------------------------------------------
      */

      if (typeof window.io !== "function") {
        console.warn(
          "LAST ALIVE: Socket.IO not available. Local mode will continue."
        );
      } else {
        console.log(
          "LAST ALIVE: Socket.IO detected"
        );
      }

      /*
      ---------------------------------------------------
      MAIN MODULE
      ---------------------------------------------------
      */

      setStatus(
        "SYSTEM BOOTING · LOADING GAME..."
      );

      await import("./main.js");

      /*
      ---------------------------------------------------
      MAIN MODULE LOADED
      ---------------------------------------------------
      */

      window.__LAST_ALIVE_MAIN_LOADED = true;

      console.log(
        "LAST ALIVE: main.js loaded"
      );

      /*
      ---------------------------------------------------
      WAIT FOR MAIN READY FLAG
      ---------------------------------------------------
      */

      const startTime =
        performance.now();

      const waitForReady = () => {

        if (
          window.__LAST_ALIVE_READY === true
        ) {

          setStatus(
            "SYSTEM READY · ENGINE ONLINE"
          );

          console.log(
            "LAST ALIVE: ENGINE READY"
          );

          return;
        }

        if (
          performance.now() - startTime >
          5000
        ) {

          throw new Error(
            "main.js loaded but engine did not become ready"
          );

        }

        requestAnimationFrame(
          waitForReady
        );
      };

      waitForReady();

    } catch (error) {

      reportError(error);

    }
  }

  /*
  -------------------------------------------------------
  GLOBAL ERROR
  -------------------------------------------------------
  */

  window.addEventListener(
    "error",
    event => {

      if (
        event?.error
      ) {

        console.error(
          "LAST ALIVE GLOBAL ERROR:",
          event.error
        );

      }

    }
  );

  /*
  -------------------------------------------------------
  UNHANDLED PROMISE
  -------------------------------------------------------
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
  -------------------------------------------------------
  START
  -------------------------------------------------------
  */

  if (
    document.readyState === "loading"
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
