export class BattleRoyaleSystem {
  constructor(T, scene, player, map, ui, input, config) {
    this.T = T;
    this.scene = scene;
    this.player = player;
    this.map = map;
    this.ui = ui;
    this.input = input;
    this.c = config;

    this.started = false;
    this.dropActive = false;
    this.dropState = "idle";
    this.dropTime = 0;
    this.dropDuration = 12;

    this.plane = null;
    this.parachute = null;
    this.dropDir = null;

    this.medkits = 2;
    this.gloo = 3;
    this.grenades = 2;

    this.airdrops = [];
    this.airdropTimer = 22;

    this.vehicle = null;
    this.inVehicle = false;
    this.vehicleCooldown = 0;

    this.keys = {
      gloo: false,
      grenade: false,
      airdrop: false,
      medkit: false,
      vehicle: false
    };

    this.bindKeys();
    this.bindMobile();
    this.buildVehicle();
    this.buildDropAircraft();
  }

  bindKeys() {
    addEventListener("keydown", e => {
      if (e.code === "KeyG") this.keys.gloo = true;
      if (e.code === "KeyH") this.keys.grenade = true;
      if (e.code === "KeyB") this.keys.airdrop = true;
      if (e.code === "KeyM") this.keys.medkit = true;
      if (e.code === "KeyF") this.keys.vehicle = true;
    });
  }

  bindMobile() {
    const buttons = {
      glooBtn: "gloo",
      grenadeBtn: "grenade",
      airdropBtn: "airdrop",
      medkitBtn: "medkit",
      vehicleBtn: "vehicle"
    };

    for (const [id, key] of Object.entries(buttons)) {
      document.getElementById(id)?.addEventListener("pointerdown", e => {
        e.preventDefault();
        this.keys[key] = true;
      });
    }
  }

  buildVehicle() {
    const T = this.T;
    const g = new T.Group();

    const bodyMat = new T.MeshStandardMaterial({
      color: 0x18211f,
      metalness: 0.72,
      roughness: 0.28
    });

    const glassMat = new T.MeshStandardMaterial({
      color: 0x17343a,
      metalness: 0.4,
      roughness: 0.2,
      transparent: true,
      opacity: 0.82
    });

    const glowMat = new T.MeshBasicMaterial({
      color: 0x49e1b0,
      transparent: true,
      opacity: 0.78
    });

    const body = new T.Mesh(new T.BoxGeometry(2.2, 0.58, 3.3), bodyMat);
    body.position.y = 0.62;
    g.add(body);

    const cabin = new T.Mesh(new T.BoxGeometry(1.55, 0.7, 1.5), glassMat);
    cabin.position.set(0, 1.08, 0.18);
    g.add(cabin);

    for (const x of [-0.98, 0.98]) {
      for (const z of [-1.08, 1.08]) {
        const wheel = new T.Mesh(
          new T.CylinderGeometry(0.34, 0.34, 0.3, 14),
          new T.MeshStandardMaterial({ color: 0x080b0c, roughness: 0.8 })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.36, z);
        g.add(wheel);
      }
    }

    const lamp = new T.Mesh(new T.BoxGeometry(0.6, 0.12, 0.06), glowMat);
    lamp.position.set(0, 0.9, -1.67);
    g.add(lamp);

    g.visible = false;
    this.scene.add(g);
    this.vehicle = g;
  }

  buildDropAircraft() {
    const T = this.T;
    this.plane = new T.Group();

    const body = new T.Mesh(
      new T.BoxGeometry(7, 1.25, 18),
      new T.MeshStandardMaterial({
        color: 0x18232c,
        metalness: 0.7,
        roughness: 0.3
      })
    );
    this.plane.add(body);

    const nose = new T.Mesh(
      new T.ConeGeometry(1.1, 4, 6),
      new T.MeshStandardMaterial({
        color: 0x2c3d48,
        metalness: 0.7,
        roughness: 0.28
      })
    );
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -11;
    this.plane.add(nose);

    for (const side of [-1, 1]) {
      const wing = new T.Mesh(
        new T.BoxGeometry(15, 0.22, 3.2),
        new T.MeshStandardMaterial({
          color: 0x10191f,
          metalness: 0.6,
          roughness: 0.34
        })
      );
      wing.position.set(0, 0, side * 2.7);
      wing.rotation.y = side * 0.08;
      this.plane.add(wing);

      const engine = new T.Mesh(
        new T.CylinderGeometry(0.55, 0.72, 2.2, 12),
        new T.MeshStandardMaterial({
          color: 0x090d10,
          metalness: 0.9,
          roughness: 0.2
        })
      );
      engine.rotation.z = Math.PI / 2;
      engine.position.set(side * 3.1, -0.35, -1.4);
      this.plane.add(engine);
    }

    this.plane.traverse(o => {
      o.castShadow = false;
      o.receiveShadow = false;
    });

    this.plane.visible = false;
    this.map.root.add(this.plane);
  }

  start() {
    this.started = true;
    this.dropActive = true;
    this.dropState = "plane";
    this.dropTime = 0;
    this.player.__combatLocked = true;

    const T = this.T;
    const x = (Math.random() - 0.5) * (this.c.world.size * 0.65);
    const z = (Math.random() - 0.5) * (this.c.world.size * 0.65);

    this.dropDir = new T.Vector3(
      Math.cos(Math.random() * Math.PI * 2),
      0,
      Math.sin(Math.random() * Math.PI * 2)
    ).normalize();

    this.dropStart = new T.Vector3(x, 170, z);
    this.player.object.position.copy(this.dropStart);
    this.player.grounded = false;
    this.player.vy = 0;

    this.plane.position.copy(this.dropStart);
    this.plane.position.addScaledVector(this.dropDir, -22);
    this.plane.position.y = 170;
    this.plane.lookAt(this.plane.position.clone().add(this.dropDir));
    this.plane.visible = true;

    this.player.character.visible = false;
    this.ui.toast("TRANSPORT INBOUND · PREPARE TO DROP");
  }

  endDrop() {
    this.dropActive = false;
    this.dropState = "landed";

    if (this.plane) this.plane.visible = false;

    if (this.parachute) {
      this.parachute.removeFromParent();
      this.parachute = null;
    }

    this.player.object.position.y = 0;
    this.player.vy = 0;
    this.player.grounded = true;
    this.player.__combatLocked = false;
    this.ui.toast("TOUCHDOWN · MATCH LIVE");
  }

  spawnAirdrop(manual = false) {
    const T = this.T;
    const angle = manual
      ? this.player.yaw + Math.PI
      : Math.random() * Math.PI * 2;
    const radius = manual ? 160 : 250 + Math.random() * 700;

    const g = new T.Group();

    const crate = new T.Mesh(
      new T.BoxGeometry(1.8, 1.3, 1.8),
      new T.MeshStandardMaterial({
        color: 0x25322c,
        metalness: 0.35,
        roughness: 0.6
      })
    );
    crate.position.y = 0.7;
    g.add(crate);

    const beacon = new T.Mesh(
      new T.CylinderGeometry(0.035, 0.035, 14, 8),
      new T.MeshBasicMaterial({
        color: 0xff4b5d,
        transparent: true,
        opacity: 0.7,
        depthWrite: false
      })
    );
    beacon.position.y = 7;
    g.add(beacon);

    const light = new T.PointLight(0xff314c, 8, 26);
    light.position.y = 4;
    g.add(light);

    g.position.set(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );

    this.map.root.add(g);
    this.airdrops.push({
      object: g,
      opened: false,
      phase: Math.random() * 10
    });
  }

  callAirdrop() {
    if (!this.started || this.dropActive) {
      this.ui.toast("AIRDROP UNAVAILABLE");
      return;
    }

    if (this.airdropTimer > 8) {
      this.ui.toast("AIRDROP NOT READY");
      return;
    }

    this.spawnAirdrop(true);
    this.airdropTimer = 38 + Math.random() * 25;
    this.ui.toast("AIRDROP CALLED · CRATE INBOUND");
  }

  openAirdrop(drop) {
    if (drop.opened) return;

    drop.opened = true;
    this.medkits = Math.min(5, this.medkits + 1);
    this.gloo = Math.min(8, this.gloo + 2);
    this.grenades = Math.min(5, this.grenades + 2);

    this.ui.toast("AIRDROP LOOT · MEDKIT + GLOO + GRENADE");
    drop.object.visible = false;
  }

  deployGloo() {
    if (this.gloo <= 0) {
      this.ui.toast("NO GLOO WALLS");
      return;
    }

    const T = this.T;
    const g = new T.Group();

    const wall = new T.Mesh(
      new T.BoxGeometry(4.8, 2.6, 0.35),
      new T.MeshStandardMaterial({
        color: 0x4f6c64,
        metalness: 0.15,
        roughness: 0.65,
        transparent: true,
        opacity: 0.94
      })
    );
    wall.position.y = 1.3;
    g.add(wall);

    const glow = new T.Mesh(
      new T.BoxGeometry(4.5, 2.45, 0.08),
      new T.MeshBasicMaterial({
        color: 0x62e6c2,
        transparent: true,
        opacity: 0.22
      })
    );
    glow.position.set(0, 1.3, -0.2);
    g.add(glow);

    const forward = new T.Vector3(
      -Math.sin(this.player.yaw),
      0,
      -Math.cos(this.player.yaw)
    );

    g.position
      .copy(this.player.object.position)
      .addScaledVector(forward, 3);

    g.rotation.y = this.player.yaw;
    this.map.root.add(g);

    this.gloo--;
    this.ui.toast("GLOO WALL DEPLOYED");

    setTimeout(() => g.removeFromParent(), 30000);
  }

  throwGrenade() {
    if (this.grenades <= 0) {
      this.ui.toast("NO GRENADES");
      return;
    }

    const T = this.T;
    const grenade = new T.Mesh(
      new T.SphereGeometry(0.13, 10, 8),
      new T.MeshStandardMaterial({
        color: 0x26332e,
        emissive: 0xff493e,
        emissiveIntensity: 0.35
      })
    );

    const forward = new T.Vector3(
      -Math.sin(this.player.yaw),
      0.35,
      -Math.cos(this.player.yaw)
    );

    grenade.position
      .copy(this.player.object.position)
      .add(new T.Vector3(0, 1.35, 0))
      .addScaledVector(forward, 1);

    this.map.root.add(grenade);
    this.grenades--;

    let life = 0;
    const start = grenade.position.clone();

    const timer = setInterval(() => {
      life += 0.05;

      grenade.position
        .copy(start)
        .addScaledVector(forward, Math.min(18, life * 15));

      grenade.position.y = Math.max(
        0.15,
        1.35 + forward.y * life * 15 - 4.8 * life * life
      );

      if (life > 0.8) {
        clearInterval(timer);
        const impact = grenade.position.clone();
        grenade.removeFromParent();
        this.explode(impact);
      }
    }, 50);
  }

  explode(pos) {
    const radius = 6;

    for (const bot of this.player.__bots || []) {
      if (!bot?.alive) continue;
      if (bot.object.position.distanceTo(pos) < radius) {
        bot.hit(45);
      }
    }

    this.ui.toast("FRAG GRENADE");
  }

  useMedkit() {
    if (this.medkits <= 0) {
      this.ui.toast("NO MEDKITS");
      return;
    }

    if (this.player.hp >= 100) {
      this.ui.toast("HP ALREADY FULL");
      return;
    }

    this.medkits--;
    this.player.hp = Math.min(100, this.player.hp + 55);
    this.ui.toast("MEDKIT USED · +55 HP");
  }

  vehicleAction() {
    if (this.vehicleCooldown > 0) return;

    if (!this.inVehicle) {
      const distance = this.player.object.position.distanceTo(
        this.vehicle.position
      );

      if (distance < 8) {
        this.inVehicle = true;
        this.vehicle.visible = true;
        this.ui.toast("VEHICLE ENTERED · F TO EXIT");
      } else {
        this.ui.toast("MOVE CLOSER TO VEHICLE");
      }
    } else {
      this.inVehicle = false;
      this.vehicle.visible = false;
      this.ui.toast("VEHICLE EXITED");
    }
  }

  update(dt, bots) {
    const T = this.T;
    this.player.__bots = bots?.bots || [];

    if (!this.started) return;

    if (this.input.consumeGloo?.()) this.deployGloo();
    if (this.input.consumeGrenade?.()) this.throwGrenade();
    if (this.input.consumeAirdrop?.()) this.callAirdrop();

    if (this.keys.gloo) {
      this.keys.gloo = false;
      this.deployGloo();
    }

    if (this.keys.grenade) {
      this.keys.grenade = false;
      this.throwGrenade();
    }

    if (this.keys.airdrop) {
      this.keys.airdrop = false;
      this.callAirdrop();
    }

    if (this.keys.medkit) {
      this.keys.medkit = false;
      this.useMedkit();
    }

    if (this.keys.vehicle) {
      this.keys.vehicle = false;
      this.vehicleAction();
    }

    const counts = document.getElementById("brCounts");
    if (counts) {
      counts.textContent =
        "G GLOO · H FRAG · B AIRDROP · M MED · F VEHICLE";
    }

    if (this.dropActive) {
      this.dropTime += dt;

      if (this.dropState === "plane") {
        this.plane.position.addScaledVector(
          this.dropDir,
          dt * 55
        );
        this.plane.lookAt(
          this.plane.position.clone().add(this.dropDir)
        );

        if (this.dropTime > 4.2) {
          this.dropState = "jump";
          this.player.object.position.copy(this.plane.position);
          this.player.object.position.y -= 1.8;
          this.ui.toast("JUMP NOW · DESCEND INTO DISTRICT 09");
        }
      } else {
        const axis = this.input.axis();

        const forward = new T.Vector3(
          -Math.sin(this.player.yaw),
          0,
          -Math.cos(this.player.yaw)
        );
        const right = new T.Vector3(
          Math.cos(this.player.yaw),
          0,
          -Math.sin(this.player.yaw)
        );

        this.player.object.position.y = Math.max(
          0,
          168 - (this.dropTime - 4.2) * 18
        );

        this.player.object.position.addScaledVector(
          forward,
          axis.y * dt * 28
        );
        this.player.object.position.addScaledVector(
          right,
          axis.x * dt * 28
        );

        const half = this.c.world.size / 2 - 20;
        this.player.object.position.x = Math.max(
          -half,
          Math.min(half, this.player.object.position.x)
        );
        this.player.object.position.z = Math.max(
          -half,
          Math.min(half, this.player.object.position.z)
        );

        this.player.character.visible = false;

        if (
          this.player.object.position.y < 115 &&
          !this.parachute
        ) {
          this.parachute = new T.Mesh(
            new T.CircleGeometry(3.8, 24),
            new T.MeshBasicMaterial({
              color: 0xe6edf2,
              transparent: true,
              opacity: 0.88,
              side: T.DoubleSide
            })
          );

          this.parachute.rotation.x = -Math.PI / 2;
          this.map.root.add(this.parachute);
          this.ui.toast("PARACHUTE DEPLOYED");
        }

        if (this.parachute) {
          this.parachute.position.copy(
            this.player.object.position
          );
          this.parachute.position.y += 5;
        }

        if (
          this.player.object.position.y <= 0 ||
          this.dropTime > this.dropDuration
        ) {
          this.endDrop();
        }
      }
    }

    for (const drop of this.airdrops) {
      if (!drop.object.visible) continue;

      drop.phase += dt;
      drop.object.rotation.y += dt * 0.25;

      const light = drop.object.children[2];
      if (light) {
        light.intensity = 6 + Math.sin(drop.phase * 4) * 3;
      }

      if (
        drop.object.position.distanceTo(
          this.player.object.position
        ) < 4
      ) {
        this.openAirdrop(drop);
      }
    }

    this.airdropTimer -= dt;

    if (this.airdropTimer <= 0) {
      this.spawnAirdrop();
      this.airdropTimer = 38 + Math.random() * 25;
      this.ui.toast("AIRDROP INCOMING");
    }

    if (this.inVehicle) {
      const axis = this.input.axis();
      const speed = 24;

      const forward = new T.Vector3(
        -Math.sin(this.player.yaw),
        0,
        -Math.cos(this.player.yaw)
      );
      const right = new T.Vector3(
        Math.cos(this.player.yaw),
        0,
        -Math.sin(this.player.yaw)
      );

      this.player.object.position.addScaledVector(
        forward,
        axis.y * speed * dt
      );
      this.player.object.position.addScaledVector(
        right,
        axis.x * speed * 0.75 * dt
      );

      const half = this.c.world.size / 2 - 20;
      this.player.object.position.x = Math.max(
        -half,
        Math.min(half, this.player.object.position.x)
      );
      this.player.object.position.z = Math.max(
        -half,
        Math.min(half, this.player.object.position.z)
      );

      this.vehicle.position.copy(this.player.object.position);
      this.vehicle.rotation.y = this.player.yaw;
      this.vehicle.visible = true;
    } else {
      this.vehicle.visible = false;
    }
  }
}
