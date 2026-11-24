export class DebugTools {

  constructor(
    config,
    game
  ) {

    this.enabled =
      !!config.debug.enabled;

    this.game =
      game;

    this.panel =
      document.getElementById(
        "debugPanel"
      );

    this.bind();
  }


  bind() {

    if (
      !this.enabled
    ) {
      return;
    }


    addEventListener(
      "keydown",
      event => {

        if (
          event.code ===
          "F2"
        ) {

          this.panel?.classList.toggle(
            "hidden"
          );
        }


        if (
          event.code ===
          "F3"
        ) {

          this.game.bots?.spawnOne?.();

          this.game.player &&
            this.game.player.object &&
            this.game.player.object.position.set(
              0,
              0,
              120
            );
        }


        if (
          event.code ===
          "F4"
        ) {

          if (
            this.game.player
          ) {

            this.game.player.hp =
              100;
          }
        }


        if (
          event.code ===
          "F5"
        ) {

          if (
            this.game.player
          ) {

            this.game.player.armor =
              100;
          }
        }


        if (
          event.code ===
          "F6"
        ) {

          if (
            this.game.player?.object
          ) {

            this.game.player.object.position.set(
              0,
              0,
              0
            );
          }
        }


        if (
          event.code ===
          "F7"
        ) {

          this.game.restart?.();
        }
      }
    );
  }


  update(
    fps
  ) {

    if (
      !this.enabled ||
      !this.panel ||
      this.panel.classList.contains(
        "hidden"
      )
    ) {

      return;
    }


    const player =
      this.game.player;


    const position =
      player?.object?.position;


    const zone =
      this.game.zone;


    const bots =
      this.game.bots;


    const network =
      this.game.network;


    this.panel.textContent =
      [
        `FPS ${fps}`,

        position
          ? `POS ${position.x.toFixed(1)} ${position.y.toFixed(1)} ${position.z.toFixed(1)}`
          : "POS -",

        bots
          ? `BOTS ${bots.alive()}`
          : "BOTS -",

        zone
          ? `ZONE ${zone.radius.toFixed(1)}`
          : "ZONE -",

        network
          ? `NET ${network.connected ? "ONLINE" : "LOCAL"}`
          : "NET -"
      ].join(
        "\n"
      );
  }
}
