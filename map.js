```js
export class WorldMap {
  constructor(T, config) {
    this.T = T;
    this.config = config;

    this.root = new T.Group();
    this.colliders = [];
    this.lootSpawns = [];
    this.points = [];
  }

  mat(
    color,
    roughness = 0.82,
    metalness = 0
  ) {
    return new this.T.MeshStandardMaterial({
      color,
      roughness,
      metalness
    });
  }

  addBox(
    x,
    y,
    z,
    w,
    h,
    d,
    color,
    solid = true,
    metal = 0
  ) {
    const T = this.T;

    const object =
      new T.Mesh(
        new T.BoxGeometry(
          w,
          h,
          d
        ),
        this.mat(
          color,
          0.78,
          metal
        )
      );

    object.position.set(
      x,
      y + h / 2,
      z
    );

    object.castShadow =
      h > 2;

    object.receiveShadow = true;

    this.root.add(object);

    if (solid) {
      this.colliders.push({
        minX: x - w / 2,
        maxX: x + w / 2,
        minZ: z - d / 2,
        maxZ: z + d / 2,
        minY: y,
        maxY: y + h
      });
    }

    return object;
  }

  building(
    x,
    z,
    w,
    d,
    h,
    color
  ) {
    this.addBox(
      x,
      0,
      z,
      w,
      h,
      d,
      color,
      true
    );

    this.addBox(
      x,
      h,
      z,
      w * 0.82,
      0.8,
      d * 0.82,
      0x252b2a,
      false,
      0.25
    );

    if (
      Math.random() > 0.35
    ) {
      for (
        let wx = -w * 0.3;
        wx <= w * 0.3;
        wx += 4
      ) {
        for (
          let wy = 3;
          wy < h - 1;
          wy += 4
        ) {
          this.addBox(
            x + wx,
            wy,
            z - d / 2 - 0.03,
            1.3,
            1.1,
            0.08,
            0x6c8c82,
            false,
            0.1
          );
        }
      }
    }

    this.lootSpawns.push({
      x:
        x +
        (Math.random() -
          0.5) *
          w *
          0.55,

      z:
        z +
        (Math.random() -
          0.5) *
          d *
          0.55
    });
  }

  warehouse(
    x,
    z,
    w,
    d,
    h
  ) {
    this.addBox(
      x,
      0,
      z,
      w,
      h,
      d,
      0x59605c,
      true,
      0.45
    );

    this.addBox(
      x,
      h,
      z,
      w + 1,
      0.35,
      d + 1,
      0x202826,
      false,
      0.6
    );

    for (
      let i = -2;
      i <= 2;
      i++
    ) {
      this.addBox(
        x +
          i *
            w *
            0.18,
        1.2,
        z -
          d / 2 -
          0.08,
        w * 0.12,
        h * 0.45,
        0.12,
        0x151a19,
        false,
        0.7
      );
    }

    this.lootSpawns.push({
      x,
      z
    });
  }

  tower(
    x,
    z,
    h = 28
  ) {
    this.addBox(
      x,
      0,
      z,
      3,
      h,
      3,
      0x252c2b,
      true,
      0.7
    );

    const mast =
      new this.T.Mesh(
        new this.T.CylinderGeometry(
          0.45,
          0.7,
          h + 10,
          8
        ),
        this.mat(
          0x303a37,
          0.65,
          0.7
        )
      );

    mast.position.set(
      x,
      h + 5,
      z
    );

    this.root.add(
      mast
    );

    for (
      let y = h * 0.35;
      y < h;
      y += 4
    ) {
      this.addBox(
        x,
        y,
        z,
        8,
        0.18,
        0.18,
        0x3f4945,
        false,
        0.4
      );
    }
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
          0.45 * scale,
          0.65 * scale,
          5 * scale,
          7
        ),
        this.mat(
          0x513d2b
        )
      );

    trunk.position.set(
      x,
      2.5 * scale,
      z
    );

    trunk.castShadow = true;

    this.root.add(
      trunk
    );

    const crown =
      new T.Mesh(
        new T.ConeGeometry(
          3.4 * scale,
          8 * scale,
          8
        ),
        this.mat(
          0x244d35
        )
      );

    crown.position.set(
      x,
      7 * scale,
      z
    );

    crown.castShadow = true;

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
    this.addBox(
      x,
      0.02,
      z,
      w,
      0.08,
      d,
      0x202523,
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
        -length / 2 + 10;
      p < length / 2;
      p += 18
    ) {
      if (horizontal) {
        this.addBox(
          x + p,
          0.07,
          z,
          8,
          0.03,
          0.18,
          0xc9b96c,
          false
        );
      } else {
        this.addBox(
          x,
          0.07,
          z + p,
          0.18,
          0.03,
          8,
          0xc9b96c,
          false
        );
      }
    }
  }

  district(
    cx,
    cz,
    kind
  ) {
    const colors = {
      city: 0x4b5352,
      industrial: 0x555a55,
      military: 0x465148,
      village: 0x635a4b
    };

    const color =
      colors[kind] ||
      0x4d5550;

    const count =
      kind === "city"
        ? 20
        : kind === "village"
        ? 14
        : 11;

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const x =
        cx +
        (Math.random() -
          0.5) *
          210;

      const z =
        cz +
        (Math.random() -
          0.5) *
          170;

      const w =
        16 +
        Math.random() *
          28;

      const d =
        14 +
        Math.random() *
          24;

      const h =
        kind === "city"
          ? 8 +
            Math.random() *
              35
          : 5 +
            Math.random() *
              15;

      if (
        kind ===
        "industrial"
      ) {
        this.warehouse(
          x,
          z,
          w + 12,
          d + 8,
          Math.max(
            7,
            h
          )
        );
      } else {
        this.building(
          x,
          z,
          w,
          d,
          h,
          color
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
    TERRAIN
    =========================================
    */

    const ground =
      new T.Mesh(
        new T.PlaneGeometry(
          size,
          size
        ),
        this.mat(
          0x334a3d,
          1
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
    WATER / OUTER BORDER
    =========================================
    */

    const water =
      new T.Mesh(
        new T.PlaneGeometry(
          1900,
          1900
        ),
        this.mat(
          0x163f49,
          0.3,
          0.25
        )
      );

    water.rotation.x =
      -Math.PI / 2;

    water.position.y =
      -1.7;

    this.root.add(
      water
    );

    /*
    =========================================
    MAIN ROAD NETWORK
    =========================================
    */

    this.road(
      0,
      0,
      1250,
      20
    );

    this.road(
      0,
      0,
      20,
      1250
    );

    this.road(
      -330,
      0,
      20,
      1250
    );

    this.road(
      330,
      0,
      20,
      1250
    );

    this.road(
      0,
      -330,
      1250,
      20
    );

    this.road(
      0,
      330,
      1250,
      20
    );

    /*
    =========================================
    DISTRICTS
    =========================================
    */

    this.district(
      -350,
      -350,
      "city"
    );

    this.district(
      350,
      -350,
      "industrial"
    );

    this.district(
      -350,
      350,
      "military"
    );

    this.district(
      350,
      350,
      "village"
    );

    this.district(
      0,
      0,
      "city"
    );

    /*
    =========================================
    MILITARY FORT
    =========================================
    */

    this.addBox(
      -350,
      0,
      350,
      300,
      2,
      260,
      0x2b302d,
      false
    );

    for (
      let x = -470;
      x <= -230;
      x += 60
    ) {
      this.addBox(
        x,
        0,
        215,
        8,
        3,
        20,
        0x70746e,
        true
      );

      this.addBox(
        x,
        0,
        485,
        8,
        3,
        20,
        0x70746e,
        true
      );
    }

    this.tower(
      -470,
      350,
      32
    );

    this.tower(
      -230,
      350,
      32
    );

    /*
    =========================================
    IRON YARD / CONTAINERS
    =========================================
    */

    for (
      let i = 0;
      i < 26;
      i++
    ) {
      const x =
        230 +
        (Math.random() -
          0.5) *
          300;

      const z =
        -350 +
        (Math.random() -
          0.5) *
          210;

      const colors = [
        0x7a3d32,
        0x315f67,
        0x6a5b35,
        0x3d4e43
      ];

      this.addBox(
        x,
        0,
        z,
        18,
        3,
        6,
        colors[
          i %
            colors.length
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

    this.addBox(
      600,
      0,
      -570,
      360,
      1,
      150,
      0x454b47,
      false
    );

    for (
      let i = 0;
      i < 7;
      i++
    ) {
      this.addBox(
        470 +
          i * 45,
        1,
        -570,
        30,
        3,
        8,
        0x5d4a36,
        true
      );
    }

    this.addBox(
      640,
      0,
      -700,
      420,
      0.5,
      260,
      0x1d4b54,
      false
    );

    /*
    =========================================
    OLD VILLAGE
    =========================================
    */

    for (
      let i = 0;
      i < 18;
      i++
    ) {
      const x =
        350 +
        (Math.random() -
          0.5) *
          260;

      const z =
        350 +
        (Math.random() -
          0.5) *
          230;

      this.addBox(
        x,
        0,
        z,
        20,
        5,
        16,
        0x625849,
        true
      );
    }

    /*
    =========================================
    FOREST BELT
    =========================================
    */

    for (
      let i = 0;
      i < 150;
      i++
    ) {
      const angle =
        Math.random() *
        Math.PI *
        2;

      const radius =
        540 +
        Math.random() *
          230;

      this.tree(
        Math.cos(angle) *
          radius,

        Math.sin(angle) *
          radius,

        0.8 +
          Math.random() *
            0.65
      );
    }

    /*
    =========================================
    ROCKS / COVER
    =========================================
    */

    for (
      let i = 0;
      i < 110;
      i++
    ) {
      const angle =
        Math.random() *
        Math.PI *
        2;

      const radius =
        180 +
        Math.random() *
          520;

      const x =
        Math.cos(angle) *
        radius;

      const z =
        Math.sin(angle) *
        radius;

      this.addBox(
        x,
        0,
        z,
        4 +
          Math.random() *
            9,

        1.5 +
          Math.random() *
            4,

        4 +
          Math.random() *
            9,

        0x4a514c,
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
        name: "DOWNTOWN",
        x: 0,
        z: 0
      },

      {
        name: "IRON YARD",
        x: 350,
        z: -350
      },

      {
        name: "FORT 09",
        x: -350,
        z: 350
      },

      {
        name: "OLD VILLAGE",
        x: 350,
        z: 350
      },

      {
        name: "HARBOR",
        x: 600,
        z: -570
      }
    ];

    return this.root;
  }

  resolve(
    position,
    radius
  ) {
    for (
      const collider of
        this.colliders
    ) {
      if (
        position.x >
          collider.minX -
            radius &&
        position.x <
          collider.maxX +
            radius &&
        position.z >
          collider.minZ -
            radius &&
        position.z <
          collider.maxZ +
            radius
      ) {
        const left =
          Math.abs(
            position.x -
              (collider.minX -
                radius)
          );

        const right =
          Math.abs(
            position.x -
              (collider.maxX +
                radius)
          );

        const top =
          Math.abs(
            position.z -
              (collider.minZ -
                radius)
          );

        const bottom =
          Math.abs(
            position.z -
              (collider.maxZ +
                radius)
          );

        const minimum =
          Math.min(
            left,
            right,
            top,
            bottom
          );

        if (
          minimum ===
          left
        ) {
          position.x =
            collider.minX -
            radius;
        } else if (
          minimum ===
          right
        ) {
          position.x =
            collider.maxX +
            radius;
        } else if (
          minimum ===
          top
        ) {
          position.z =
            collider.minZ -
            radius;
        } else {
          position.z =
            collider.maxZ +
            radius;
        }
      }
    }
  }

  validSpawn(
    position,
    playerPosition,
    minimumDistance = 100
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
      ) < 760 &&

      Math.abs(
        position.z
      ) < 760
    );
  }
}
```
