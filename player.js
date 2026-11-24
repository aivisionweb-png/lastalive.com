export class PlayerController {

  constructor(
    T,
    config,
    input,
    map
  ) {

    this.T = T;
    this.c = config;
    this.input = input;
    this.map = map;

    this.object =
      new T.Group();

    this.object.position.set(
      0,
      0,
      650
    );

    this.yaw =
      Math.PI;

    this.pitch =
      -0.04;

    this.vy = 0;
    this.grounded = true;

    this.hp = 100;
    this.armor = 75;

    this.kills = 0;

    this.alive = true;

    this.stamina = 100;

    this.recoil = 0;

    this.walkTime = 0;
    this.cameraMode = "FPP";
    this.character = this.buildCharacter();

    this.viewModel =
      new T.Group();

    this.gun =
      new T.Group();

    this.currentWeapon =
      null;

    this.buildWeaponHands();
    this.character.visible = true;
    this.map.root.add(this.character);
  }

  buildCharacter() {
    const T=this.T, g=new T.Group();
    const skin=new T.MeshStandardMaterial({color:0xc58a68,roughness:.8});
    const suit=new T.MeshStandardMaterial({color:0x263849,roughness:.72,metalness:.08});
    const vest=new T.MeshStandardMaterial({color:0x17212a,roughness:.65,metalness:.2});
    const accent=new T.MeshStandardMaterial({color:0xe39a3b,roughness:.45,metalness:.25});
    const boot=new T.MeshStandardMaterial({color:0x101417,roughness:.9});
    const torso=new T.Mesh(new T.CapsuleGeometry(.36,.72,6,10),suit); torso.position.y=1.05; g.add(torso);
    const vestMesh=new T.Mesh(new T.BoxGeometry(.76,.62,.48),vest); vestMesh.position.set(0,1.1,0); g.add(vestMesh);
    const head=new T.Mesh(new T.SphereGeometry(.27,16,12),skin); head.position.y=1.88; g.add(head);
    const helmet=new T.Mesh(new T.SphereGeometry(.31,16,10),vest); helmet.scale.y=.58; helmet.position.y=2.08; g.add(helmet);
    const visor=new T.Mesh(new T.BoxGeometry(.4,.08,.06),accent); visor.position.set(0,2.03,-.28); g.add(visor);
    for(const x of [-.21,.21]){
      const arm=new T.Mesh(new T.CapsuleGeometry(.11,.55,5,8),suit); arm.position.set(x,1.03,0); arm.rotation.z=x>0?-0.18:0.18; g.add(arm);
      const hand=new T.Mesh(new T.SphereGeometry(.12,10,8),skin); hand.position.set(x*.98,.72,-.04); g.add(hand);
      const leg=new T.Mesh(new T.CapsuleGeometry(.13,.62,5,8),suit); leg.position.set(x*.48,.43,0); g.add(leg);
      const foot=new T.Mesh(new T.BoxGeometry(.2,.13,.42),boot); foot.position.set(x*.48,.1,-.08); g.add(foot);
    }
    const pack=new T.Mesh(new T.BoxGeometry(.48,.72,.22),vest); pack.position.set(0,1.15,.28); g.add(pack);
    const beacon=new T.Mesh(new T.TorusGeometry(.55,.025,8,24),new T.MeshBasicMaterial({color:0xff4b3e,transparent:true,opacity:.65,depthWrite:false})); beacon.rotation.x=Math.PI/2; beacon.position.y=.04; g.add(beacon);
    g.traverse(o=>{o.castShadow=true;o.receiveShadow=true});
    g.userData.character=true;
    return g;
  }

  setCameraMode(mode) {
    this.cameraMode = mode === "TPP" ? "TPP" : "FPP";
    if(this.cameraMode==="TPP") this.viewModel.visible=false;
    this.character.visible=this.cameraMode==="TPP";
    return this.cameraMode;
  }

  buildWeaponHands() {

    const T = this.T;

    /*
    =========================================
    ARM MATERIALS
    =========================================
    */

    const sleeve =
      new T.MeshStandardMaterial({
        color: 0x202b27,
        roughness: 0.8
      });

    const skin =
      new T.MeshStandardMaterial({
        color: 0xb97859,
        roughness: 0.9
      });

    /*
    =========================================
    LEFT ARM
    =========================================
    */

    const leftArm =
      new T.Mesh(
        new T.CapsuleGeometry(
          0.105,
          0.55,
          5,
          10
        ),
        sleeve
      );

    leftArm.rotation.z =
      0.32;

    leftArm.position.set(
      -0.25,
      -0.19,
      -0.54
    );

    /*
    =========================================
    RIGHT ARM
    =========================================
    */

    const rightArm =
      new T.Mesh(
        new T.CapsuleGeometry(
          0.105,
          0.55,
          5,
          10
        ),
        sleeve
      );

    rightArm.rotation.z =
      -0.32;

    rightArm.position.set(
      0.25,
      -0.2,
      -0.56
    );

    /*
    =========================================
    HANDS
    =========================================
    */

    const leftHand =
      new T.Mesh(
        new T.SphereGeometry(
          0.13,
          12,
          8
        ),
        skin
      );

    leftHand.position.set(
      -0.17,
      -0.15,
      -0.83
    );

    const rightHand =
      new T.Mesh(
        new T.SphereGeometry(
          0.13,
          12,
          8
        ),
        skin
      );

    rightHand.position.set(
      0.17,
      -0.15,
      -0.84
    );

    this.viewModel.add(
      leftArm,
      rightArm,
      leftHand,
      rightHand,
      this.gun
    );
  }

  setWeapon(def) {

    const T = this.T;

    this.currentWeapon =
      def;

    while (
      this.gun.children.length
    ) {

      this.gun.remove(
        this.gun.children[0]
      );

    }

    /*
    =========================================
    WEAPON BODY
    =========================================
    */

    const weaponColor =
      def.id === "sniper"
        ? 0x151919
        : def.id === "shotgun"
        ? 0x584330
        : def.id === "pistol"
        ? 0x252928
        : 0x101515;

    const length =
      def.id === "sniper"
        ? 2.05
        : def.id === "shotgun"
        ? 1.35
        : def.id === "pistol"
        ? 0.75
        : 1.5;

    const body =
      new T.Mesh(
        new T.BoxGeometry(
          0.22,
          0.2,
          length
        ),
        new T.MeshStandardMaterial({
          color:
            weaponColor,
          metalness: 0.7,
          roughness: 0.28
        })
      );

    body.position.set(
      0.16,
      -0.06,
      -0.88
    );

    this.gun.add(body);

    /*
    =========================================
    GRIP
    =========================================
    */

    const grip =
      new T.Mesh(
        new T.BoxGeometry(
          0.18,
          0.42,
          0.18
        ),
        new T.MeshStandardMaterial({
          color: 0x151918,
          roughness: 0.65
        })
      );

    grip.rotation.x =
      -0.25;

    grip.position.set(
      0.16,
      -0.32,
      -0.43
    );

    this.gun.add(grip);

    /*
    =========================================
    MAGAZINE
    =========================================
    */

    const mag =
      new T.Mesh(
        new T.BoxGeometry(
          0.14,
          0.45,
          0.2
        ),
        new T.MeshStandardMaterial({
          color: 0x292d2c,
          metalness: 0.5,
          roughness: 0.4
        })
      );

    mag.position.set(
      0.16,
      -0.27,
      -0.68
    );

    this.gun.add(mag);

    /*
    =========================================
    BARREL
    =========================================
    */

    const barrel =
      new T.Mesh(
        new T.CylinderGeometry(
          0.045,
          0.055,
          0.5,
          12
        ),
        new T.MeshStandardMaterial({
          color: 0x080a0a,
          metalness: 0.9,
          roughness: 0.2
        })
      );

    barrel.rotation.x =
      Math.PI / 2;

    barrel.position.set(
      0.16,
      -0.05,
      -1.65
    );

    this.gun.add(
      barrel
    );

    /*
    =========================================
    MUZZLE
    =========================================
    */

    const muzzle =
      new T.Mesh(
        new T.CylinderGeometry(
          0.065,
          0.065,
          0.18,
          12
        ),
        new T.MeshStandardMaterial({
          color: 0x050606,
          metalness: 1,
          roughness: 0.15
        })
      );

    muzzle.rotation.x =
      Math.PI / 2;

    muzzle.position.set(
      0.16,
      -0.05,
      -1.91
    );

    this.gun.add(
      muzzle
    );

    /*
    =========================================
    OPTIC
    =========================================
    */

    if (
      def.scope &&
      def.scope !== "IRON"
    ) {

      const optic =
        new T.Mesh(
          new T.BoxGeometry(
            0.18,
            0.18,
            0.38
          ),
          new T.MeshStandardMaterial({
            color: 0x1e2523,
            metalness: 0.8,
            roughness: 0.2
          })
        );

      optic.position.set(
        0.16,
        0.11,
        -0.92
      );

      this.gun.add(
        optic
      );

      const lens =
        new T.Mesh(
          new T.CylinderGeometry(
            0.06,
            0.06,
            0.025,
            16
          ),
          new T.MeshBasicMaterial({
            color: 0x51d9c4
          })
        );

      lens.rotation.x =
        Math.PI / 2;

      lens.position.set(
        0.16,
        0.11,
        -1.13
      );

      this.gun.add(
        lens
      );
    }
  }

  update(dt) {

    if (!this.alive) {
      return;
    }

    const axis =
      this.input.axis();

    const look =
      this.input.takeLook();

    /*
    =========================================
    MOUSE LOOK
    =========================================
    */

    this.yaw -=
      look.x * 0.0023;

    this.pitch -=
      look.y * 0.0018;

    this.pitch =
      Math.max(
        -1.25,
        Math.min(
          1.05,
          this.pitch
        )
      );

    /*
    =========================================
    MOVEMENT
    =========================================
    */

    const forward =
      new this.T.Vector3(
        -Math.sin(
          this.yaw
        ),
        0,
        -Math.cos(
          this.yaw
        )
      );

    const right =
      new this.T.Vector3(
        Math.cos(
          this.yaw
        ),
        0,
        -Math.sin(
          this.yaw
        )
      );

    const move =
      new this.T.Vector3();

    move.addScaledVector(
      forward,
      axis.y
    );

    move.addScaledVector(
      right,
      axis.x
    );

    if (
      move.lengthSq() > 1
    ) {
      move.normalize();
    }

    const crouching =
      this.input.isCrouch();

    const sprinting =
      this.input.isSprint() &&
      !crouching &&
      move.lengthSq() > 0.01 &&
      this.stamina > 0;

    if (sprinting) {

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
            dt * 12
        );

    }

    const speed =
      sprinting
        ? this.c.player.sprintSpeed
        : crouching
        ? this.c.player.crouchSpeed
        : this.c.player.walkSpeed;

    if (
      move.lengthSq() > 0.001
    ) {

      this.object.position.addScaledVector(
        move,
        speed * dt
      );

      this.walkTime +=
        dt *
        (sprinting ? 12 : 8);

    }

    /*
    =========================================
    COLLISION
    =========================================
    */

    this.map.resolve(
      this.object.position,
      this.c.player.radius
    );

    const worldHalf =
      this.c.world.size /
      2 -
      20;

    this.object.position.x =
      Math.max(
        -worldHalf,
        Math.min(
          worldHalf,
          this.object.position.x
        )
      );

    this.object.position.z =
      Math.max(
        -worldHalf,
        Math.min(
          worldHalf,
          this.object.position.z
        )
      );

    /*
    =========================================
    JUMP
    =========================================
    */

    if (
      this.input.consumeJump() &&
      this.grounded &&
      !crouching
    ) {

      this.vy =
        this.c.player.jump;

      this.grounded =
        false;

    }

    this.vy -=
      this.c.player.gravity *
      dt;

    this.object.position.y +=
      this.vy * dt;

    if (
      this.object.position.y <= 0
    ) {

      this.object.position.y =
        0;

      this.vy = 0;

      this.grounded =
        true;

    }

    /*
    =========================================
    RECOIL RECOVERY
    =========================================
    */

    this.recoil +=
      (0 - this.recoil) *
      Math.min(
        1,
        dt * 9
      );
  }

  cameraUpdate(
    camera,
    dt
  ) {

    if(this.cameraMode==="TPP"){
      this.viewModel.visible=false;
      this.character.visible=true;
      this.character.position.copy(this.object.position);
      this.character.rotation.y=this.yaw;
      const behind=new this.T.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw));
      const target=this.object.position.clone().add(new this.T.Vector3(0,1.35,0));
      const desired=this.object.position.clone().add(new this.T.Vector3(0,1.65,0)).addScaledVector(behind,4.6);
      camera.position.lerp(desired,Math.min(1,dt*10));
      camera.lookAt(target);
      camera.fov += (72-camera.fov)*Math.min(1,dt*10);
      camera.updateProjectionMatrix();
      return;
    }

    /*
    =========================================
    TRUE FPP POSITION
    =========================================
    */

    const crouch =
      this.input.isCrouch();

    const eyeHeight =
      crouch
        ? 1.28
        : 1.68;

    const moving =
      this.input
        .axis()
        .x !== 0 ||
      this.input
        .axis()
        .y !== 0;

    const bobAmount =
      moving
        ? crouch
          ? 0.018
          : 0.035
        : 0;

    const bobX =
      moving
        ? Math.cos(
            this.walkTime
          ) *
          bobAmount
        : 0;

    const bobY =
      moving
        ? Math.abs(
            Math.sin(
              this.walkTime
            )
          ) *
          bobAmount
        : 0;

    camera.position.set(
      this.object.position.x +
        bobX,

      this.object.position.y +
        eyeHeight +
        bobY,

      this.object.position.z
    );

    /*
    =========================================
    CAMERA ROTATION
    =========================================
    */

    camera.rotation.order =
      "YXZ";

    camera.rotation.y =
      this.yaw;

    camera.rotation.x =
      this.pitch -
      this.recoil;

    camera.rotation.z =
      moving
        ? Math.sin(
            this.walkTime *
              0.5
          ) *
          0.003
        : 0;

    /*
    =========================================
    FOV / ADS
    =========================================
    */

    const aiming =
      this.input.isAim();

    let targetFov =
      76;

    if (aiming) {

      if (
        this.currentWeapon
          ?.id === "sniper"
      ) {
        targetFov = 28;
      } else if (
        this.currentWeapon
          ?.scope === "4X"
      ) {
        targetFov = 42;
      } else {
        targetFov = 55;
      }

    }

    camera.fov +=
      (targetFov -
        camera.fov) *
      Math.min(
        1,
        dt * 12
      );

    camera.updateProjectionMatrix();

    /*
    =========================================
    WEAPON
    =========================================
    */

    if (
      this.viewModel.parent !==
      camera
    ) {

      camera.add(
        this.viewModel
      );

    }

    const weaponBob =
      moving
        ? Math.sin(
            this.walkTime
          ) * 0.012
        : 0;

    this.viewModel.position.set(
      aiming
        ? 0
        : 0.015,

      aiming
        ? -0.015
        : -0.01 +
          weaponBob,

      aiming
        ? -0.52
        : -0.68
    );

    this.viewModel.rotation.set(
      0,
      0,
      0
    );

    this.viewModel.visible =
      true;
  }

  damage(
    amount
  ) {

    if (!this.alive) {
      return;
    }

    const armorDamage =
      Math.min(
        this.armor,
        amount * 0.65
      );

    this.armor -=
      armorDamage;

    this.hp -=
      amount -
      armorDamage;

    if (
      this.hp <= 0
    ) {

      this.hp = 0;

      this.alive =
        false;

    }

    return this.alive;
  }

  addRecoil(
    amount
  ) {

    this.recoil +=
      amount;

    this.recoil =
      Math.min(
        0.16,
        this.recoil
      );
  }
}
