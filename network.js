export class NetworkClient {

  constructor(config, ui) {

    this.config = config;
    this.ui = ui;

    this.socket = null;

    this.connected = false;

    this.remotePlayers = new Map();

  }


  connect(playerName) {

    if (
      !this.config?.network?.enabled
    ) {
      return false;
    }


    if (
      typeof window.io !== "function"
    ) {

      console.warn(
        "Socket.IO client not loaded"
      );

      return false;

    }


    try {

      this.socket = window.io(
        this.config.network.url,
        {
          transports: [
            "websocket",
            "polling"
          ],

          timeout: 5000,

          reconnection: true,

          reconnectionAttempts: 5,

          reconnectionDelay: 1000
        }
      );


      this.socket.on(
        "connect",
        () => {

          this.connected = true;


          console.log(
            "LAST ALIVE NETWORK CONNECTED",
            this.socket.id
          );


          if (
            this.ui?.toast
          ) {

            this.ui.toast(
              "NETWORK ONLINE"
            );

          }


          this.socket.emit(
            "create-room",
            {
              name: String(
                playerName ||
                "PLAYER"
              ).slice(
                0,
                14
              )
            }
          );

        }
      );


      this.socket.on(
        "disconnect",
        reason => {

          this.connected = false;

          console.warn(
            "Network disconnected:",
            reason
          );

        }
      );


      this.socket.on(
        "connect_error",
        error => {

          this.connected = false;

          console.warn(
            "Network error:",
            error?.message
          );

        }
      );


      this.socket.on(
        "player-joined",
        data => {

          if (!data?.id) {
            return;
          }

          this.remotePlayers.set(
            data.id,
            data
          );

        }
      );


      this.socket.on(
        "player-left",
        data => {

          if (!data?.id) {
            return;
          }

          this.remotePlayers.delete(
            data.id
          );

        }
      );


      this.socket.on(
        "state",
        data => {

          if (
            !data?.players
          ) {
            return;
          }


          for (
            const player of data.players
          ) {

            if (
              player.id
            ) {

              this.remotePlayers.set(
                player.id,
                player
              );

            }

          }

        }
      );


      return true;

    } catch (
      error
    ) {

      console.error(
        "Network initialization failed:",
        error
      );

      this.connected = false;

      return false;

    }

  }


  sendInput(state) {

    if (
      !this.connected ||
      !this.socket
    ) {
      return;
    }


    this.socket.emit(
      "input",
      state
    );

  }


  sendShot(data) {

    if (
      !this.connected ||
      !this.socket
    ) {
      return;
    }


    this.socket.emit(
      "shoot",
      data
    );

  }


  sendState(state) {

    if (
      !this.connected ||
      !this.socket
    ) {
      return;
    }


    this.socket.emit(
      "player-state",
      state
    );

  }


  disconnect() {

    if (
      this.socket
    ) {

      this.socket.disconnect();

      this.socket = null;

    }

    this.connected = false;

    this.remotePlayers.clear();

  }

}
