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

    this.onAllDead = null;

    this.spawn();
  }

  make(index) {
    const T = this.T;

    const group =
      new T.Group();

    const outfits = [
      [0x5b3434, 0x29302d],
      [0x34546b, 0x202b2a],
      [0x5b5a32, 0x32372a],
      [0x563d60, 0x29262f],
      [0x4d3f2c, 0x2a2924],
      [0x2d554a, 0x202c29]
    ];

    const [
      shirt,
      vest
    ] =
      outfits[
        index %
          outfits.length
      ];

    const body =
      new T.Mesh(
        new T.CapsuleGeometry(
          0.36,
          0.85,
          6,
          9
        ),
        new T.MeshStandardMaterial({
          color: shirt,
          roughness: 0.8
        })
      );

    body.position.y =
      1.02;

    group.add(body);

    const head =
      new T.Mesh(
        new T.SphereGeometry(
          0.27,
          14,
          9
        ),
        new T.MeshStandardMaterial({
          color: 0xb9795b,
          roughness: 0.9
        })
      );

    head.position.y =
      1.85;

    head.userData.head =
      true;

    group.add(head);

    const helmet =
      new T.Mesh(
        new T.SphereGeometry(
          0.3,
          14,
          8
        ),
        new T.MeshStandardMaterial({
          color: vest,
          roughness: 0.7,
          metalness: 0.15
        })
      );

    helmet.scale.y =
      0.55;

    helmet.position.y =
      2.05;

    group.add(helmet);

    const vestMesh =
      new T.Mesh(
        new T.BoxGeometry(
          0.82,
          0.7,
          0.5
        ),
        new T.MeshStandardMaterial({
          color: vest,
          roughness: 0.7
        })
      );

    vestMesh.position.y =
      1.08;

    group.add(vestMesh);

    const gun =
      new T.Mesh(
        new T.BoxGeometry(
          0.13,
          0.13,
          1.1
        ),
        new T.MeshStandardMaterial({
          color: 0x101313,
          metalness: 0.65,
          roughness: 0.3
        })
      );

    gun.position.set(
      0.4,
      1.1,
      -0.55
    );

    group.add(gun);

    // High-visibility tactical enemy outline / beacon.
    const glowMat = new T.MeshBasicMaterial({
      color: 0xff234f,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: T.AdditiveBlending
    });

    const ring = new T.Mesh(
      new T.TorusGeometry(0.62, 0.045, 8, 24),
      glowMat
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.06;
    group.add(ring);

    const beacon = new T.Mesh(
      new T.CylinderGeometry(0.035, 0.035, 3.4, 8),
      glowMat
    );
    beacon.position.y = 1.8;
    group.add(beacon);

    const beaconTop = new T.Mesh(
      new T.SphereGeometry(0.11, 8, 8),
      glowMat
    );
    beaconTop.position.y = 3.5;
    group.add(beaconTop);

    group.userData.enemyGlow = { ring, beacon, beaconTop };

    // Billboard enemy identifier: always faces the camera and stays readable.
    const labelCanvas=document.createElement("canvas");
    labelCanvas.width=256; labelCanvas.height=64;
    const lctx=labelCanvas.getContext("2d");
    lctx.fillStyle="rgba(120,8,20,.86)"; lctx.fillRect(4,8,248,48);
    lctx.strokeStyle="#ff5268"; lctx.lineWidth=3; lctx.strokeRect(4,8,248,48);
    lctx.font="900 26px Arial"; lctx.textAlign="center"; lctx.textBaseline="middle"; lctx.fillStyle="#fff";
    lctx.fillText("ENEMY",128,32);
    const label=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(labelCanvas),transparent:true,depthTest:false,depthWrite:false}));
    label.scale.set(1.65,.42,1); label.position.y=3.9; label.renderOrder=20; group.add(label);

    const data = {
      alive: true,

      hp: 100,

      armor:
        40 +
        Math.random() *
          60,

      cool:
        0.3 +
        Math.random(),

      roam:
        Math.random() *
        Math.PI *
        2,

      object: group,

      hit: damage =>
        this.hit(
          data,
          damage
        )
    };

    group.userData.bot =
      data;

    group.userData.botName =
      "ENEMY " +
      String(index + 1)
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
      this.make(index);

    let position;

    let attempts = 0;

    do {
      const angle =
        Math.random() *
        Math.PI *
        2;

      const near = index < 12;

      const radius = near
        ? 180 + Math.random() * 320
        : 420 + Math.random() * 650;

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
        attempts > 180
      ) {
        position.set(
          (Math.random() -
            0.5) *
            1900,
          0,
          (Math.random() -
            0.5) *
            1900
        );

        break;
      }
    } while (
      !this.map.validSpawn(
        position,
        this.player.object.position,
        120
      )
    );

    bot.object.position.copy(
      position
    );

    this.bots.push(bot);

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

  relocateAroundPlayer() {
    const center=this.player.object.position.clone();
    center.y=0;

    this.bots.forEach((bot,index)=>{
      const angle=(index/this.bots.length)*Math.PI*2 + Math.random()*.5;
      const radius=index<16 ? 55+Math.random()*180 : 220+Math.random()*650;
      const pos=new this.T.Vector3(
        center.x+Math.cos(angle)*radius,
        0,
        center.z+Math.sin(angle)*radius
      );

      bot.object.position.copy(pos);
      bot.object.visible=true;
      bot.alive=true;
      bot.hp=100;
      bot.armor=50;
    });
  }


  hit(
    bot,
    damage
  ) {
    if (!bot.alive) {
      return;
    }

    const absorbed =
      Math.min(
        bot.armor,
        damage * 0.55
      );

    bot.armor -=
      absorbed;

    bot.hp -=
      damage -
      absorbed;

    if (bot.hp <= 0) {
      bot.hp = 0;
      bot.alive = false;

      bot.object.visible = false;

      this.player.kills++;
      this.ui.killStreak?.(this.player.kills);

      this.ui.killFeed(
        "YOU",
        bot.object
          .userData
          .botName ||
          "ENEMY"
      );

      this.ui.toast(
        "ENEMY ELIMINATED"
      );

      if (
        this.alive() === 0
      ) {
        this.onAllDead?.();
      }
    }
  }

  alive() {
    return this.bots.filter(
      b => b.alive
    ).length;
  }

  update(dt) {
    for (
      const bot of this.bots
    ) {
      if (!bot.alive) {
        continue;
      }

      const dx =
        this.player.object
          .position.x -
        bot.object.position.x;

      const dz =
        this.player.object
          .position.z -
        bot.object.position.z;

      const distance =
        Math.hypot(
          dx,
          dz
        );

      const glow = bot.object.userData.enemyGlow;
      if (glow) {
        const pulse = 0.72 + Math.sin(performance.now() * 0.006 + bot.roam) * 0.18;
        glow.ring.material.opacity = pulse;
        glow.beacon.material.opacity = pulse * 0.72;
        glow.beaconTop.material.opacity = pulse;
        glow.ring.scale.setScalar(1 + Math.sin(performance.now() * 0.004 + bot.roam) * 0.08);
      }

      bot.roam +=
        dt *
        (0.3 +
          Math.random() *
            0.1);

      if (
        distance <
        this.c.bots.detect
      ) {
        const angle =
          Math.atan2(
            dx,
            dz
          );

        bot.object.rotation.y =
          angle;

        if (
          distance >
          this.c.bots.minRange
        ) {
          const speed =
            this.c.bots.speed *
            (distance > 100
              ? 1.15
              : 1);

          bot.object.position.x +=
            Math.sin(angle) *
            speed *
            dt;

          bot.object.position.z +=
            Math.cos(angle) *
            speed *
            dt;

          this.map.resolve(
            bot.object.position,
            0.4
          );
        }

        bot.cool -= dt;

        if (
          distance <
            this.c.bots.shootRange &&
          bot.cool <= 0
        ) {
          bot.cool =
            0.65 +
            Math.random() *
              1.1;

          if (
            Math.random() <
            this.c.bots.accuracy
          ) {
            const damage =
              6 +
              Math.random() *
                8;

            this.player.damage(
              damage
            );

            this.ui.damage();
          }
        }
      } else {
        if (
          Math.random() <
          dt * 0.12
        ) {
          bot.roam +=
            Math.PI *
            (Math.random() -
              0.5);
        }

        bot.object.position.x +=
          Math.sin(
            bot.roam
          ) *
          this.c.bots.speed *
          0.18 *
          dt;

        bot.object.position.z +=
          Math.cos(
            bot.roam
          ) *
          this.c.bots.speed *
          0.18 *
          dt;

        this.map.resolve(
          bot.object.position,
          0.4
        );
      }
    }
  }
}
