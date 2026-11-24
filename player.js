export class PlayerController {
  constructor(T, config, input, map) {
    this.T = T;
    this.c = config;
    this.input = input;
    this.map = map;

    this.object = new T.Group();

    this.object.position.set(
      0,
      0,
      620
    );

    this.yaw = 0;
    this.pitch = -0.05;

    this.vy = 0;
    this.grounded = true;

    this.hp = 100;
    this.armor = 75;
    this.kills = 0;
    this.alive = true;

    this.stamina = 100;
    this.recoil = 0;

    this.viewModel =
      new T.Group();

    this.gun =
      new T.Group();

    this.currentWeapon = null;

    this.build();
  }

  build() {
    const T = this.T;

    const body =
      new T.Mesh(
        new T.CapsuleGeometry(
          0.38,
          0.9,
          6,
          10
        ),
        new T.MeshStandardMaterial({
          color: 0x202b27,
          roughness: 0.75
        })
      );

    body.position.y = 1.05;

    this.object.add(body);

    const head =
      new T.Mesh(
        new T.SphereGeometry(
          0.28,
          16,
          10
        ),
        new T.MeshStandardMaterial({
          color: 0xb9795b,
          roughness: 0.9
        })
      );

    head.position.y = 1.9;

    this.object.add(head);

    const vest =
      new T.Mesh(
        new T.BoxGeometry(
          0.8,
          0.7,
          0.48
        ),
        new T.MeshStandardMaterial({
          color: 0x354a42,
          roughness: 0.7
        })
      );

    vest.position.y = 1.08;

    this.object.add(vest);

    const skin =
      new T.MeshStandardMaterial({
        color: 0xb9795b,
        roughness: 0.85
      });

    const sleeve =
      new T.MeshStandardMaterial({
        color: 0x28352f,
        roughness: 0.75
      });

    const armL =
      new T.Mesh(
        new T.CapsuleGeometry(
          0.11,
          0.48,
          5,
          8
        ),
        sleeve
      );

    armL.rotation.z = 0.28;

    armL.position.set(
      -0.22,
      -0.18,
      -0.62
    );

    const armR =
      new T.Mesh(
        new T.CapsuleGeometry(
          0.11,
          0.48,
          5,
          8
        ),
        sleeve
      );

    armR.rotation.z = -0.28;

    armR.position.set(
      0.18,
      -0.2,
      -0.66
    );

    const handL =
      new T.Mesh(
        new T.SphereGeometry(
          0.13,
          10,
          8
        ),
        skin
      );

    handL.position.set(
      -0.18,
      -0.12,
      -0.91
    );

    const handR =
      new T.Mesh(
        new T.SphereGeometry(
          0.13,
          10,
          8
        ),
        skin
      );

    handR.position.set(
      0.18,
      -0.12,
      -0.92
    );

    this.viewModel.add(
      armL,
      armR,
      handL,
      handR,
      this.gun
    );
  }

  setWeapon(def) {
    const T = this.T;

    this.currentWeapon = def;

    while (
      this.gun.children.length
    ) {
      this.gun.remove(
        this.gun.children[0]
      );
    }

    const color =
      def.id === "sniper"
        ? 0x171b1b
        : def.id === "shotgun"
        ? 0x5b4b38
        : def.id === "pistol"
        ? 0x222625
        : 0x111615;

    const length =
      def.id === "sniper"
        ? 1.9
        : def.id === "shotgun"
        ? 1.25
        : def.id === "pistol"
        ? 0.72
        : 1.35;

    const body =
      new T.Mesh(
        new T.BoxGeometry(
          0.18,
          0.18,
          length
        ),
        new T.MeshStandardMaterial({
          color,
          metalness: 0.65,
          roughness: 0.3
        })
      );

    body.position.set(
      0.28,
      -0.08,
      -0.78
    );

    this.gun.add(body);

    const barrel =
      new T.Mesh(
        new T.CylinderGeometry(
          0.045,
          0.045,
          0.45,
          8
        ),
        new T.MeshStandardMaterial({
          color: 0x080a0a,
          metalness: 0.8,
          roughness: 0.2
        })
      );

    barrel.rotation.x =
      Math.PI / 2;

    barrel.position.set(
      0.28,
      -0.08,
      -0.78 -
        length / 2 -
        0.18
    );

    this.gun.add(barrel);

    if (
      def.scope &&
      def.scope !== "IRON"
    ) {
      const optic =
        new T.Mesh(
          new T.BoxGeometry(
            0.16,
            0.16,
            0.34
          ),
          new T.MeshStandardMaterial({
            color: 0x252c2b,
            metalness: 0.7,
            roughness: 0.25
          })
        );

      optic.position.set(
        0.28,
        0.06,
        -0.72
      );

      this.gun.add(optic);

      const lens =
        new T.Mesh(
          new T.CylinderGeometry(
            0.055,
            0.055,
            0.02,
            16
          ),
          new T.MeshBasicMaterial({
            color: 0x4fd5c0
          })
        );

      lens.rotation.x =
        Math.PI / 2;

      lens.position.set(
        0.28,
        0.06,
        -0.9
      );

      this.gun.add(lens);
    }
  }

  update(dt) {
    if (!this.alive) {
      return;
    }

    const a =
      this.input.axis();

    const look =
      this.input.takeLook();

    this.yaw -=
      look.x * 0.0022;

    this.pitch =
      TMathClamp(
        this.pitch -
          look.y * 0.0018,
        -1.2,
        0.85
      );

    this.recoil =
      Math.max(
        0,
        this.recoil -
          dt * 4
      );

    const forward =
      new this.T.Vector3(
        -Math.sin(this.yaw),
        0,
        -Math.cos(this.yaw)
      );

    const right =
      new this.T.Vector3(
        Math.cos(this.yaw),
        0,
        -Math.sin(this.yaw)
      );

    const move =
      new this.T.Vector3();

    move
      .addScaledVector(
        forward,
        a.y
      )
      .addScaledVector(
        right,
        a.x
      );

    if (
      move.lengthSq() > 1
    ) {
      move.normalize();
    }

    const crouch =
      this.input.isCrouch();

    const sprint =
      this.input.isSprint() &&
      !crouch &&
      move.lengthSq() > 0.01 &&
      this.stamina > 0;

    if (sprint) {
      this.stamina =
        Math.max(
          0,
          this.stamina -
            dt * 20
        );
    } else {
      this.stamina =
        Math.min(
          100,
          this.stamina +
            dt * 14
        );
    }

    const speed =
      sprint
        ? this.c.player.sprintSpeed
        : crouch
        ? this.c.player.crouchSpeed
        : this.c.player.walkSpeed;

    this.object.position.addScaledVector(
      move,
      dt * speed
    );

    this.map.resolve(
      this.object.position,
      this.c.player.radius
    );

    this.object.position.x =
      TMathClamp(
        this.object.position.x,
        -780,
        780
      );

    this.object.position.z =
      TMathClamp(
        this.object.position.z,
        -780,
        780
      );

    if (
      this.input.consumeJump() &&
      this.grounded &&
      !crouch
    ) {
      this.vy =
        this.c.player.jump;

      this.grounded = false;
    }

    this.vy -=
      this.c.player.gravity *
      dt;

    this.object.position.y +=
      this.vy * dt;

    if (
      this.object.position.y <= 0
    ) {
      if (
        !this.grounded &&
        this.vy < -14
      ) {
        this.damage(
          Math.min(
            30,
            (-this.vy - 14) * 2
          ),
          true
        );
      }

      this.object.position.y = 0;
      this.vy = 0;
      this.grounded = true;
    }

    this.object.rotation.y =
      this.yaw;
  }

  damage(amount, fall = false) {
    if (!this.alive) {
      return;
    }

    const absorb =
      fall
        ? 0
        : Math.min(
            this.armor,
            amount * 0.65
          );

    this.armor =
      Math.max(
        0,
        this.armor - absorb
      );

    this.hp =
      Math.max(
        0,
        this.hp -
          (amount - absorb)
      );

    if (this.hp <= 0) {
      this.alive = false;
    }

    return this.alive;
  }

  addRecoil(amount) {
    this.recoil =
      Math.min(
        0.22,
        this.recoil + amount
      );

    this.pitch +=
      amount * 0.7;
  }

  cameraUpdate(camera) {
    const p =
      this.object.position.clone();

    p.y +=
      this.input.isCrouch()
        ? 1.38
        : 1.68;

    camera.position.copy(p);

    const aim =
      this.input.isAim();

    const targetFov =
      aim
        ? this.currentWeapon?.id ===
          "sniper"
          ? 24
          : 45
        : 74;

    camera.fov +=
      (targetFov -
        camera.fov) *
      0.18;

    camera.updateProjectionMatrix();

    const dir =
      new this.T.Vector3(
        -Math.sin(this.yaw) *
          Math.cos(
            this.pitch -
              this.recoil
          ),
        Math.sin(
          this.pitch -
            this.recoil
        ),
        -Math.cos(this.yaw) *
          Math.cos(
            this.pitch -
              this.recoil
          )
      );

    camera.lookAt(
      p.clone().add(dir)
    );

    if (
      this.viewModel.parent !==
      camera
    ) {
      camera.add(
        this.viewModel
      );
    }

    this.viewModel.position.set(
      aim ? 0.02 : 0.03,
      aim ? 0.02 : 0.01,
      aim ? -0.58 : -0.72
    );

    this.viewModel.rotation.set(
      0,
      0,
      0
    );

    this.viewModel.visible =
      true;
  }
}

function TMathClamp(
  v,
  a,
  b
) {
  return Math.max(
    a,
    Math.min(b, v)
  );
}
