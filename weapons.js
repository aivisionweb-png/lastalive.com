export class WeaponSystem {
  constructor(
    T,
    weapons,
    player,
    ui,
    audio
  ) {
    this.T = T;
    this.defs = weapons;
    this.player = player;
    this.ui = ui;
    this.audio = audio;

    this.index = 0;

    this.states =
      weapons.map(w => ({
        ...w,
        ammo: w.mag,
        reserve: w.reserve
      }));

    this.last = 0;
    this.reloadUntil = 0;

    this.ray =
      new T.Raycaster();

    this.player.setWeapon(
      this.current
    );
  }

  get current() {
    return this.states[
      this.index
    ];
  }

  switch(index) {
    if (
      index < 0 ||
      index >= this.states.length
    ) {
      return;
    }

    this.index = index;
    this.reloadUntil = 0;

    this.player.setWeapon(
      this.current
    );

    this.ui.toast(
      this.current.name +
      " · " +
      this.current.scope
    );

    this.ui.weapon(
      this.current,
      false
    );
  }

  addAmmo(amount = 30) {
    const w =
      this.current;

    w.reserve =
      Math.max(
        0,
        w.reserve +
          (Number(amount) || 0)
      );

    this.ui.weapon(
      w,
      this.reloadUntil > 0
    );
  }

  reload() {
    const w =
      this.current;

    if (
      this.reloadUntil ||
      w.ammo >= w.mag ||
      w.reserve <= 0
    ) {
      return;
    }

    this.reloadUntil =
      performance.now() +
      w.reload * 1000;

    this.ui.setReload(true);
  }

  update() {
    if (
      this.reloadUntil &&
      performance.now() >=
        this.reloadUntil
    ) {
      const w =
        this.current;

      const needed =
        w.mag -
        w.ammo;

      const take =
        Math.min(
          needed,
          w.reserve
        );

      w.ammo += take;
      w.reserve -= take;

      this.reloadUntil = 0;

      this.ui.setReload(false);
    }

    this.ui.weapon(
      this.current,
      this.reloadUntil > 0
    );
  }

  shoot(
    scene,
    camera,
    bots
  ) {
    if (this.reloadUntil) {
      return;
    }

    const w =
      this.current;

    const now =
      performance.now();

    if (
      now - this.last <
      w.rate
    ) {
      return;
    }

    if (w.ammo <= 0) {
      this.reload();
      return;
    }

    this.last = now;
    w.ammo--;

    this.audio?.gun?.();

    this.player.addRecoil(
      w.recoil || 0.01
    );

    const pellets =
      w.pellets || 1;

    const alive =
      bots.filter(
        b =>
          b &&
          b.alive &&
          b.object
      );

    const objects =
      alive.map(
        b => b.object
      );

    for (
      let i = 0;
      i < pellets;
      i++
    ) {
      const sx =
        (Math.random() - 0.5) *
        w.spread;

      const sy =
        (Math.random() - 0.5) *
        w.spread;

      this.ray.setFromCamera(
        new this.T.Vector2(
          sx,
          sy
        ),
        camera
      );

      const hits =
        this.ray.intersectObjects(
          objects,
          true
        );

      let end =
        this.ray.ray.origin
          .clone()
          .add(
            this.ray.ray.direction
              .clone()
              .multiplyScalar(
                w.range
              )
          );

      if (hits.length) {
        end.copy(
          hits[0].point
        );

        let object =
          hits[0].object;

        while (
          object &&
          !object.userData?.bot
        ) {
          object =
            object.parent;
        }

        if (
          object?.userData?.bot
        ) {
          const head =
            hits[0]
              .object
              .userData
              .head === true;

          object.userData.bot.hit(
            head
              ? w.damage * 2
              : w.damage
          );

          this.ui.hit();
        }
      }

      this.tracer(
        scene,
        end
      );
    }
  }

  flash() {
    const flash =
      new this.T.Mesh(
        new this.T.SphereGeometry(
          0.13,
          6,
          6
        ),
        new this.T.MeshBasicMaterial({
          color: 0xffc35c
        })
      );

    this.player.gun.add(
      flash
    );

    setTimeout(
      () => {
        flash.removeFromParent();
      },
      40
    );
  }

  tracer(
    scene,
    end
  ) {
    this.flash();

    const start =
      this.player.gun.getWorldPosition(
        new this.T.Vector3()
      );

    const direction =
      end
        .clone()
        .sub(start);

    const length =
      direction.length();

    if (
      length <= 0.001
    ) {
      return;
    }

    const mesh =
      new this.T.Mesh(
        new this.T.CylinderGeometry(
          0.008,
          0.008,
          length,
          4
        ),
        new this.T.MeshBasicMaterial({
          color: 0xffd98b,
          transparent: true,
          opacity: 0.55
        })
      );

    mesh.position
      .copy(start)
      .add(end)
      .multiplyScalar(
        0.5
      );

    mesh.quaternion.setFromUnitVectors(
      new this.T.Vector3(
        0,
        1,
        0
      ),
      direction.normalize()
    );

    scene.add(mesh);

    setTimeout(
      () => {
        mesh.removeFromParent();
      },
      45
    );
  }
}
