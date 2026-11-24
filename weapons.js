export class WeaponSystem {

  constructor(T, weapons, player, ui, audio) {

    this.T = T;
    this.defs = weapons;
    this.player = player;
    this.ui = ui;
    this.audio = audio;

    this.index = 0;

    this.states = weapons.map(w => ({
      ...w,
      ammo: w.mag
    }));

    this.last = 0;
    this.reloadUntil = 0;

    this.ray = new T.Raycaster();
  }


  get current() {
    return this.states[this.index];
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

    this.ui.toast(
      this.current.name
    );

    this.ui.weapon(
      this.current,
      false
    );
  }


  addAmmo(amount = 30) {

    const value =
      Math.max(
        0,
        Number(amount) || 0
      );

    const weapon =
      this.current;

    weapon.reserve =
      Math.max(
        0,
        weapon.reserve + value
      );

    this.ui.weapon(
      weapon,
      this.reloadUntil > 0
    );
  }


  reload() {

    const weapon =
      this.current;

    if (this.reloadUntil) {
      return;
    }

    if (
      weapon.ammo >=
      weapon.mag
    ) {
      return;
    }

    if (
      weapon.reserve <= 0
    ) {
      return;
    }

    this.reloadUntil =
      performance.now() +
      weapon.reload * 1000;

    this.ui.setReload(true);
  }


  update() {

    if (
      this.reloadUntil &&
      performance.now() >=
        this.reloadUntil
    ) {

      const weapon =
        this.current;

      const needed =
        weapon.mag -
        weapon.ammo;

      const take =
        Math.min(
          needed,
          weapon.reserve
        );

      weapon.ammo += take;
      weapon.reserve -= take;

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

    if (
      this.reloadUntil
    ) {
      return;
    }

    const weapon =
      this.current;

    const now =
      performance.now();

    if (
      now - this.last <
      weapon.rate
    ) {
      return;
    }

    if (
      weapon.ammo <= 0
    ) {

      this.reload();

      return;
    }

    this.last = now;

    weapon.ammo--;

    this.audio.gun();

    this.flash();

    const pellets =
      weapon.pellets || 1;


    for (
      let i = 0;
      i < pellets;
      i++
    ) {

      const sx =
        (Math.random() - 0.5) *
        weapon.spread;

      const sy =
        (Math.random() - 0.5) *
        weapon.spread;


      this.ray.setFromCamera(
        new this.T.Vector2(
          sx,
          sy
        ),
        camera
      );


      const aliveBots =
        bots.filter(
          bot =>
            bot &&
            bot.alive &&
            bot.object
        );


      const objects =
        aliveBots.map(
          bot =>
            bot.object
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
                weapon.range
              )
          );


      if (
        hits.length > 0
      ) {

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

          object.userData.bot.hit(
            weapon.damage
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
          0.12,
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
          0.01,
          0.01,
          length,
          4
        ),
        new this.T.MeshBasicMaterial({
          color: 0xffd98b,
          transparent: true,
          opacity: 0.6
        })
      );


    mesh.position
      .copy(start)
      .add(end)
      .multiplyScalar(0.5);


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
