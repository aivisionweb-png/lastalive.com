export class WorldMap {

  constructor(
    T,
    config
  ) {

    this.T = T;
    this.config = config;

    this.root =
      new T.Group();

    this.colliders = [];

    this.lootSpawns = [];

    this.points = [];
  }

  material(
    color,
    roughness = 0.8,
    metalness = 0
  ) {

    return new this.T.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      envMapIntensity: 0.85
    });
  }

  box(
    x,
    y,
    z,
    w,
    h,
    d,
    color,
    solid = true,
    metalness = 0
  ) {

    const mesh =
      new this.T.Mesh(
        new this.T.BoxGeometry(
          w,
          h,
          d
        ),
        this.material(
          color,
          0.78,
          metalness
        )
      );

    mesh.position.set(
      x,
      y + h / 2,
      z
    );

    mesh.castShadow = solid && h >= 4;
    mesh.receiveShadow = solid && h >= 4;

    this.root.add(
      mesh
    );

    if (solid) {

      this.colliders.push({
        minX: x - w / 2,
        maxX: x + w / 2,
        minZ: z - d / 2,
        maxZ: z + d / 2
      });

    }

    return mesh;
  }

  building(
    x,
    z,
    w,
    d,
    h,
    color
  ) {

    this.box(
      x,
      0,
      z,
      w,
      h,
      d,
      color,
      true
    );

    /*
    ROOFTOP
    */

    this.box(
      x,
      h,
      z,
      w * 0.92,
      0.7,
      d * 0.92,
      0x252b2a,
      false,
      0.4
    );

    /*
    WINDOWS
    */

    const windowMat =
      new this.T.MeshStandardMaterial({
        color: 0x86a7a2,
        emissive: 0x243f3d,
        emissiveIntensity: 0.9,
        metalness: 0.25,
        roughness: 0.3
      });

    for (
      let y = 3;
      y < h - 1;
      y += 3.8
    ) {

      for (
        let ix = -1;
        ix <= 1;
        ix++
      ) {

        const win =
          new this.T.Mesh(
            new this.T.BoxGeometry(
              1.7,
              1.25,
              0.08
            ),
            windowMat
          );

        win.castShadow=false;
        win.receiveShadow=false;
        win.position.set(
          x +
            ix *
              Math.max(
                3,
                w * 0.28
              ),

          y,

          z -
            d / 2 -
            0.05
        );

        this.root.add(
          win
        );
      }
    }

    /*
    ROOF AC UNITS
    */

    if (h > 14) {

      for (
        let i = 0;
        i < 3;
        i++
      ) {

        this.box(
          x -
            w * 0.25 +
            i * w * 0.25,

          h + 0.7,

          z,

          2.2,
          1.2,
          1.8,

          0x39413e,
          false,
          0.5
        );

      }

    }

    this.lootSpawns.push({
      x,
      z
    });
  }

  warehouse(
    x,
    z,
    w,
    d,
    h
  ) {

    this.box(
      x,
      0,
      z,
      w,
      h,
      d,
      0x535a56,
      true,
      0.4
    );

    /*
    ROOF
    */

    this.box(
      x,
      h,
      z,
      w + 2,
      0.4,
      d + 2,
      0x252a28,
      false,
      0.7
    );

    /*
    ROLL-UP DOORS
    */

    for (
      let i = -1;
      i <= 1;
      i++
    ) {

      this.box(
        x +
          i *
            w *
            0.3,

        0.1,

        z -
          d / 2 -
          0.06,

        w * 0.2,

        h * 0.65,

        0.1,

        0x1d2422,

        false
      );

    }

    this.lootSpawns.push({
      x,
      z
    });
  }

  tree(
    x,
    z,
    scale = 1
  ) {

    const T = this.T;

    const trunk =
      new T.Mesh(
        new T.CylinderGeometry(
          0.35 * scale,
          0.55 * scale,
          5 * scale,
          8
        ),
        this.material(
          0x503927
        )
      );

    trunk.position.set(
      x,
      2.5 * scale,
      z
    );

    trunk.castShadow =
      true;

    this.root.add(
      trunk
    );

    const crown =
      new T.Mesh(
        new T.ConeGeometry(
          3.5 * scale,
          8 * scale,
          9
        ),
        this.material(
          0x123d35,
          0.95,
          0.05
        )
      );

    crown.position.set(
      x,
      7 * scale,
      z
    );

    crown.castShadow =
      true;

    this.root.add(
      crown
    );
  }

  road(
    x,
    z,
    w,
    d
  ) {

    this.box(
      x,
      0.01,
      z,
      w,
      0.08,
      d,
      0x111a20,
      false
    );

    const horizontal =
      w > d;

    const length =
      horizontal
        ? w
        : d;

    for (
      let p =
        -length / 2 + 12;

      p <
      length / 2;

      p += 24
    ) {

      if (
        horizontal
      ) {

        this.box(
          x + p,
          0.09,
          z,

          10,
          0.025,
          0.22,

          0xffb84d,
          false
        );

      } else {

        this.box(
          x,
          0.09,
          z + p,

          0.22,
          0.025,
          10,

          0xd0bc69,
          false
        );

      }
    }
  }

  tower(
    x,
    z,
    height = 45
  ) {

    this.box(
      x,
      0,
      z,
      4,
      height,
      4,
      0x29322f,
      true,
      0.7
    );

    const mast =
      new this.T.Mesh(
        new this.T.CylinderGeometry(
          0.35,
          0.6,
          height + 15,
          8
        ),
        this.material(
          0x303936,
          0.5,
          0.8
        )
      );

    mast.position.set(
      x,
      height + 7,
      z
    );

    this.root.add(
      mast
    );
  }

  district(
    cx,
    cz,
    type
  ) {

    let count = 18;

    if (
      type === "city"
    ) {
      count = 34;
    }

    if (
      type === "industrial"
    ) {
      count = 18;
    }

    if (
      type === "village"
    ) {
      count = 25;
    }

    for (
      let i = 0;
      i < count;
      i++
    ) {

      const x =
        cx +
        (Math.random() -
          0.5) *
          320;

      const z =
        cz +
        (Math.random() -
          0.5) *
          260;

      const w =
        18 +
        Math.random() *
          35;

      const d =
        16 +
        Math.random() *
          32;

      const h =
        type === "city"
          ? 10 +
            Math.random() *
              42
          : type ===
            "village"
          ? 5 +
            Math.random() *
              7
          : 7 +
            Math.random() *
              16;

      if (
        type ===
        "industrial"
      ) {

        this.warehouse(
          x,
          z,
          w + 15,
          d + 10,
          h
        );

      } else {

        const colors = [
          0x4b5352,
          0x505958,
          0x5a5d57,
          0x46524c,
          0x5b554b
        ];

        this.building(
          x,
          z,
          w,
          d,
          h,
          colors[
            i %
              colors.length
          ]
        );

      }
    }
  }

  build() {

    const T = this.T;

    const size =
      this.config.world
        .size;

    /*
    =========================================
    HUGE TERRAIN
    =========================================
    */

    const ground =
      new T.Mesh(
        new T.PlaneGeometry(
          size,
          size
        ),
        this.material(
          0x182d2b,
          0.95
        )
      );

    ground.rotation.x =
      -Math.PI / 2;

    ground.receiveShadow =
      true;

    this.root.add(
      ground
    );

    /*
    =========================================
    WATER
    =========================================
    */

    const water =
      new T.Mesh(
        new T.PlaneGeometry(
          3100,
          3100
        ),
        this.material(
          0x0b4e63,
          0.18,
          0.65
        )
      );

    water.rotation.x =
      -Math.PI / 2;

    water.position.y =
      -2;

    this.root.add(
      water
    );

    /*
    =========================================
    MAIN ROAD GRID
    =========================================
    */

    this.road(
      0,
      0,
      2200,
      28
    );

    this.road(
      0,
      0,
      28,
      2200
    );

    this.road(
      -520,
      0,
      24,
      1900
    );

    this.road(
      520,
      0,
      24,
      1900
    );

    this.road(
      0,
      -520,
      1900,
      24
    );

    this.road(
      0,
      520,
      1900,
      24
    );

    /*
    =========================================
    DISTRICTS
    =========================================
    */

    this.district(
      -520,
      -520,
      "city"
    );

    this.district(
      520,
      -520,
      "industrial"
    );

    this.district(
      -520,
      520,
      "military"
    );

    this.district(
      520,
      520,
      "village"
    );

    this.district(
      0,
      0,
      "city"
    );

    /*
    =========================================
    MILITARY BASE
    =========================================
    */

    this.box(
      -520,
      0,
      520,
      400,
      2,
      330,
      0x29322d,
      false
    );

    for (
      let x = -690;
      x <= -350;
      x += 70
    ) {

      this.box(
        x,
        0,
        350,
        9,
        4,
        20,
        0x6b746e,
        true
      );

      this.box(
        x,
        0,
        690,
        9,
        4,
        20,
        0x6b746e,
        true
      );

    }

    this.tower(
      -700,
      520,
      55
    );

    this.tower(
      -340,
      520,
      55
    );

    /*
    =========================================
    IRON YARD
    =========================================
    */

    const containerColors = [
      0x7a3d32,
      0x315e65,
      0x695c38,
      0x3c5145
    ];

    for (
      let i = 0;
      i < 55;
      i++
    ) {

      const x =
        520 +
        (Math.random() -
          0.5) *
          400;

      const z =
        -520 +
        (Math.random() -
          0.5) *
          320;

      this.box(
        x,
        0,
        z,
        20,
        3,
        7,
        containerColors[
          i %
            containerColors.length
        ],
        true,
        0.35
      );
    }

    /*
    =========================================
    HARBOR
    =========================================
    */

    this.box(
      760,
      0,
      -900,
      500,
      1,
      180,
      0x474d49,
      false
    );

    this.box(
      760,
      0,
      -1040,
      700,
      0.5,
      240,
      0x17434c,
      false
    );

    for (
      let i = 0;
      i < 9;
      i++
    ) {

      this.box(
        540 +
          i * 55,

        1,

        -900,

        34,
        4,
        10,

        0x634b34,
        true
      );

    }

    /*
    =========================================
    VILLAGE
    =========================================
    */

    for (
      let i = 0;
      i < 30;
      i++
    ) {

      const x =
        520 +
        (Math.random() -
          0.5) *
          350;

      const z =
        520 +
        (Math.random() -
          0.5) *
          320;

      this.building(
        x,
        z,
        18 +
          Math.random() *
            15,
        15 +
          Math.random() *
            12,
        5 +
          Math.random() *
            5,
        0x625747
      );

    }

    /*
    =========================================
    FOREST RING
    =========================================
    */

    for (
      let i = 0;
      i < 280;
      i++
    ) {

      const angle =
        Math.random() *
        Math.PI *
        2;

      const radius =
        850 +
        Math.random() *
          320;

      this.tree(
        Math.cos(angle) *
          radius,

        Math.sin(angle) *
          radius,

        0.8 +
          Math.random() *
            0.8
      );
    }

    /*
    =========================================
    ROCK COVER
    =========================================
    */

    for (
      let i = 0;
      i < 180;
      i++
    ) {

      const x =
        (Math.random() -
          0.5) *
        2100;

      const z =
        (Math.random() -
          0.5) *
        2100;

      this.box(
        x,
        0,
        z,

        4 +
          Math.random() *
            10,

        1.5 +
          Math.random() *
            5,

        4 +
          Math.random() *
            10,

        0x4b534d,
        true
      );

    }

    /*
    =========================================
    LANDMARKS
    =========================================
    */

    this.points = [

      {
        name:
          "DOWNTOWN",
        x: 0,
        z: 0
      },

      {
        name:
          "IRON YARD",
        x: 520,
        z: -520
      },

      {
        name:
          "FORT 09",
        x: -520,
        z: 520
      },

      {
        name:
          "OLD VILLAGE",
        x: 520,
        z: 520
      },

      {
        name:
          "HARBOR",
        x: 760,
        z: -900
      }

    ];

    /* =========================================
       DISTRICT 09 ATMOSPHERE + LANDMARK LIGHTS
       ========================================= */
    const neonMat = new T.MeshBasicMaterial({
      color: 0x35d9ff,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    const orangeMat = new T.MeshBasicMaterial({
      color: 0xff8b3d,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });

    // Downtown signal pylons
    for (const p of [
      [-90, -90], [90, -90], [-90, 90], [90, 90]
    ]) {
      const pole = new T.Mesh(new T.CylinderGeometry(0.035,0.06,9,8), neonMat);
      pole.position.set(p[0],4.5,p[1]);
      this.root.add(pole);
      const orb = new T.Mesh(new T.SphereGeometry(0.16,10,8), neonMat);
      orb.position.set(p[0],9.2,p[1]);
      this.root.add(orb);
    }

    // Street light network
    for(let i=-900;i<=900;i+=120){
      for(const side of [-1,1]){
        const x=i;
        const z=side*24;
        const pole=new T.Mesh(new T.CylinderGeometry(.045,.08,6.5,7),orangeMat);
        pole.position.set(x,3.25,z);
        this.root.add(pole);
        // Emissive lamp mesh only: avoids hundreds of dynamic point lights.
      }
    }

    // Floating dust / atmosphere particles
    const dustGeo=new T.BufferGeometry();
    const dustCount=450;
    const dustPos=new Float32Array(dustCount*3);
    for(let i=0;i<dustCount;i++){
      dustPos[i*3]=(Math.random()-.5)*2200;
      dustPos[i*3+1]=1+Math.random()*55;
      dustPos[i*3+2]=(Math.random()-.5)*2200;
    }
    dustGeo.setAttribute("position",new T.BufferAttribute(dustPos,3));
    const dust=new T.Points(dustGeo,new T.PointsMaterial({
      color:0x7fdcff,size:.7,transparent:true,opacity:.16,depthWrite:false
    }));
    this.root.add(dust);

    return this.root;
  }

  resolve(
    position,
    radius
  ) {

    for (
      const c of
        this.colliders
    ) {

      if (
        position.x >
          c.minX -
            radius &&
        position.x <
          c.maxX +
            radius &&
        position.z >
          c.minZ -
            radius &&
        position.z <
          c.maxZ +
            radius
      ) {

        const left =
          Math.abs(
            position.x -
              (c.minX -
                radius)
          );

        const right =
          Math.abs(
            position.x -
              (c.maxX +
                radius)
          );

        const top =
          Math.abs(
            position.z -
              (c.minZ -
                radius)
          );

        const bottom =
          Math.abs(
            position.z -
              (c.maxZ +
                radius)
          );

        const smallest =
          Math.min(
            left,
            right,
            top,
            bottom
          );

        if (
          smallest ===
          left
        ) {

          position.x =
            c.minX -
            radius;

        } else if (
          smallest ===
          right
        ) {

          position.x =
            c.maxX +
            radius;

        } else if (
          smallest ===
          top
        ) {

          position.z =
            c.minZ -
            radius;

        } else {

          position.z =
            c.maxZ +
            radius;

        }
      }
    }
  }

  validSpawn(
    position,
    playerPosition,
    minimumDistance = 120
  ) {

    return (

      Math.hypot(
        position.x -
          playerPosition.x,

        position.z -
          playerPosition.z
      ) >
        minimumDistance &&

      Math.abs(
        position.x
      ) <
        this.config.world.size /
          2 -

          30 &&

      Math.abs(
        position.z
      ) <
        this.config.world.size /
          2 -

          30
    );
  }
}
