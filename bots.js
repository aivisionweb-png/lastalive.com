export class BotManager {

  constructor(
    T,
    config,
    map,
    player,
    combat,
    ui
  ) {

    this.T = T;
    this.c = config;
    this.map = map;
    this.player = player;
    this.combat = combat;
    this.ui = ui;

    this.bots = [];

    this.spawn();
  }


  make(index) {

    const T =
      this.T;


    const group =
      new T.Group();


    const body =
      new T.Mesh(
        new T.CapsuleGeometry(
          0.36,
          0.85,
          6,
          9
        ),
        new T.MeshStandardMaterial({
          color:
            index % 2
              ? 0x743638
              : 0x365b6e,
          roughness: 0.8
        })
      );


    body.position.y =
      1.02;


    group.add(
      body
    );


    const head =
      new T.Mesh(
        new T.SphereGeometry(
          0.27,
          14,
          9
        ),
        new T.MeshStandardMaterial({
          color: 0xc48b69
        })
      );


    head.position.y =
      1.85;


    group.add(
      head
    );


    const gun =
      new T.Mesh(
        new T.BoxGeometry(
          0.13,
          0.13,
          1
        ),
        new T.MeshStandardMaterial({
          color: 0x111414,
          metalness: 0.5
        })
      );


    gun.position.set(
      0.4,
      1.1,
      -0.5
    );


    group.add(
      gun
    );


    const data = {

      alive: true,

      hp: 100,

      cool:
        Math.random(),

      object:
        group,

      hit:
        damage =>
          this.hit(
            data,
            damage
          )
    };


    group.userData.bot =
      data;


    group.userData.botName =
      "BOT " +
      String(index)
        .padStart(
          2,
          "0"
        );


    return data;
  }


  spawnOne() {

    const index =
      this.bots.length;


    const bot =
      this.make(
        index
      );


    let position;


    let attempts = 0;


    do {

      const angle =
        Math.random() *
        Math.PI *
        2;


      const radius =
        130 +
        Math.random() *
        250;


      position =
        new this.T.Vector3(
          Math.cos(angle) *
            radius,
          0,
          Math.sin(angle) *
            radius
        );


      attempts++;


      if (
        attempts > 100
      ) {
        position.set(
          200,
          0,
          200
        );

        break;
      }

    } while (
      !this.map.validSpawn(
        position,
        this.player.object.position,
        100
      )
    );


    bot.object.position.copy(
      position
    );


    this.bots.push(
      bot
    );


    this.map.root.add(
      bot.object
    );


    return bot;
  }


  spawn() {

    for (
      let i = 0;
      i <
      this.c.world.botCount;
      i++
    ) {

      this.spawnOne();
    }
  }


  hit(
    bot,
    damage
  ) {

    if (
      !bot.alive
    ) {
      return;
    }


    bot.hp -=
      damage;


    if (
      bot.hp <= 0
    ) {

      bot.hp =
        0;

      bot.alive =
        false;

      bot.object.visible =
        false;


      this.player.kills++;


      this.ui.killFeed(
        "YOU",
        bot.object.userData.botName ||
          "BOT"
      );


      this.ui.toast(
        "ENEMY ELIMINATED"
      );


      if (
        this.alive() ===
        0
      ) {

        this.onAllDead?.();
      }
    }
  }


  alive() {

    return this.bots.filter(
      bot =>
        bot.alive
    ).length;
  }


  update(dt) {

    for (
      const bot of this.bots
    ) {

      if (
        !bot.alive
      ) {
        continue;
      }


      const dx =
        this.player.object.position.x -
        bot.object.position.x;


      const dz =
        this.player.object.position.z -
        bot.object.position.z;


      const distance =
        Math.hypot(
          dx,
          dz
        );


      if (
        distance >=
        this.c.bots.detect
      ) {
        continue;
      }


      const angle =
        Math.atan2(
          dx,
          dz
        );


      bot.object.rotation.y =
        angle;


      if (
        distance > 28
      ) {

        bot.object.position.x +=
          Math.sin(angle) *
          this.c.bots.speed *
          dt;


        bot.object.position.z +=
          Math.cos(angle) *
          this.c.bots.speed *
          dt;


        this.map.resolve(
          bot.object.position,
          0.4
        );
      }


      bot.cool -=
        dt;


      if (
        distance <
          this.c.bots.shootRange &&
        bot.cool <= 0
      ) {

        bot.cool =
          this.c.bots.shootCooldown +
          Math.random() *
            0.8;


        this.player.damage(
          5 +
          Math.random() *
            5
        );
      }
    }
  }
}
