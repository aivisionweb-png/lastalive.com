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


  spawn(count = 25) {

    const types = [
      "ammo",
      "medkit",
      "armor"
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
        50 +
        Math.random() *
        340;


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


      let color;

      if (
        type === "ammo"
      ) {

        color = 0xe0c25c;

      } else if (
        type === "medkit"
      ) {

        color = 0x64e69b;

      } else {

        color = 0x6fa8df;
      }


      const material =
        new this.T.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.18
        });


      const object =
        new this.T.Mesh(
          new this.T.BoxGeometry(
            1.2,
            1.2,
            1.2
          ),
          material
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

      if (
        !item.visible
      ) {
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


      const distance =
        item.position.distanceTo(
          this.player.object.position
        );


      if (
        distance >= 2.4
      ) {
        continue;
      }


      const type =
        item.userData.type;


      if (
        type === "ammo"
      ) {

        this.weapons?.addAmmo(
          45
        );

      }


      if (
        type === "medkit"
      ) {

        this.player.hp =
          Math.min(
            100,
            this.player.hp + 35
          );

      }


      if (
        type === "armor"
      ) {

        this.player.armor =
          Math.min(
            100,
            this.player.armor + 35
          );

      }


      item.visible = false;


      this.ui.toast(
        type.toUpperCase() +
        " PICKED UP"
      );
    }
  }
}
