export class LootSystem {
  constructor(
    T,
    map,
    player,
    ui,
    weapons
  ) {
    this.T = T;
    this.map = map;
    this.player = player;
    this.ui = ui;
    this.weapons = weapons;

    this.items = [];
  }

  spawn(count = 100) {
    const types = [
      "ammo",
      "medkit",
      "armor",
      "weapon",
      "attachment",
      "helmet"
    ];

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const angle =
        Math.random() *
        Math.PI *
        2;

      const radius =
        60 +
        Math.random() *
          650;

      const x =
        Math.cos(angle) *
        radius;

      const z =
        Math.sin(angle) *
        radius;

      const type =
        types[
          Math.floor(
            Math.random() *
              types.length
          )
        ];

      const colors = {
        ammo: 0xe0c25c,
        medkit: 0x64e69b,
        armor: 0x6fa8df,
        weapon: 0xf0a64f,
        attachment: 0x8f7cff,
        helmet: 0xb9c2c0
      };

      const object =
        new this.T.Mesh(
          type === "helmet"
            ? new this.T.CylinderGeometry(
                0.55,
                0.7,
                0.45,
                10
              )
            : new this.T.BoxGeometry(
                1.15,
                1.15,
                1.15
              ),
          new this.T.MeshStandardMaterial({
            color: colors[type],
            emissive: colors[type],
            emissiveIntensity: 0.15,
            metalness:
              type === "helmet"
                ? 0.5
                : 0
          })
        );

      object.position.set(
        x,
        0.8,
        z
      );

      object.userData = {
        type,
        phase:
          Math.random() * 10
      };

      object.castShadow = true;

      this.map.root.add(
        object
      );

      this.items.push(
        object
      );
    }
  }

  update(dt) {
    for (
      const item of this.items
    ) {
      if (!item.visible) {
        continue;
      }

      item.rotation.y +=
        dt * 1.8;

      item.position.y =
        0.8 +
        Math.sin(
          performance.now() *
            0.003 +
          item.userData.phase
        ) *
          0.15;

      if (
        item.position.distanceTo(
          this.player.object.position
        ) >= 2.6
      ) {
        continue;
      }

      const type =
        item.userData.type;

      if (type === "ammo") {
        this.weapons?.addAmmo(
          60
        );
      }

      if (type === "medkit") {
        this.player.hp =
          Math.min(
            100,
            this.player.hp + 35
          );
      }

      if (type === "armor") {
        this.player.armor =
          Math.min(
            100,
            this.player.armor + 35
          );
      }

      if (type === "helmet") {
        this.player.armor =
          Math.min(
            100,
            this.player.armor + 20
          );
      }

      if (type === "weapon") {
        this.weapons?.addAmmo(
          90
        );

        this.ui.toast(
          "WEAPON CACHE · +90 AMMO"
        );
      } else {
        this.ui.toast(
          type.toUpperCase() +
          " PICKED UP"
        );
      }

      item.visible = false;
    }
  }
}
