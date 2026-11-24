export const CONFIG = {
  world: {
    size: 2400,
    groundY: 0,
    botCount: 49
  },

  player: {
    height: 1.75,
    radius: 0.42,
    walkSpeed: 7,
    sprintSpeed: 13,
    crouchSpeed: 3.5,
    jump: 8.8,
    gravity: 24,
    maxHP: 100,
    maxArmor: 100
  },

  zone: {
    startRadius: 1050,
    phases: [
      { wait: 22, target: 820, duration: 30, damage: 1 },
      { wait: 18, target: 650, duration: 28, damage: 2 },
      { wait: 15, target: 500, duration: 26, damage: 3 },
      { wait: 12, target: 350, duration: 24, damage: 5 },
      { wait: 10, target: 210, duration: 20, damage: 8 },
      { wait: 8, target: 90, duration: 16, damage: 12 }
    ]
  },

  bots: {
    detect: 320,
    shootRange: 115,
    speed: 3.2,
    minRange: 18,
    accuracy: 0.62
  },

  debug: {
    enabled: false
  },

  network: {
    enabled: true,
    url: "https://lastalive-com.onrender.com"
  }
};

export const WEAPONS = [
  {
    id: "ar",
    name: "VX-556",
    type: "ASSAULT RIFLE",
    damage: 25,
    rate: 105,
    mag: 30,
    reserve: 180,
    spread: 0.012,
    range: 280,
    reload: 0.9,
    recoil: 0.014,
    scope: "RED DOT"
  },
  {
    id: "smg",
    name: "K-9",
    type: "SMG",
    damage: 18,
    rate: 72,
    mag: 40,
    reserve: 240,
    spread: 0.022,
    range: 170,
    reload: 0.8,
    recoil: 0.010,
    scope: "HOLO"
  },
  {
    id: "shotgun",
    name: "M-12",
    type: "SHOTGUN",
    damage: 12,
    rate: 680,
    mag: 6,
    reserve: 42,
    spread: 0.075,
    pellets: 9,
    range: 95,
    reload: 1.15,
    recoil: 0.045,
    scope: "IRON"
  },
  {
    id: "dmr",
    name: "R-47",
    type: "DMR",
    damage: 48,
    rate: 360,
    mag: 20,
    reserve: 120,
    spread: 0.006,
    range: 420,
    reload: 1.25,
    recoil: 0.020,
    scope: "4X"
  },
  {
    id: "sniper",
    name: "VSR-9",
    type: "SNIPER",
    damage: 95,
    rate: 1150,
    mag: 5,
    reserve: 35,
    spread: 0.001,
    range: 800,
    reload: 1.7,
    recoil: 0.060,
    scope: "6X"
  },
  {
    id: "pistol",
    name: "PX-9",
    type: "PISTOL",
    damage: 34,
    rate: 260,
    mag: 15,
    reserve: 90,
    spread: 0.016,
    range: 210,
    reload: 0.75,
    recoil: 0.012,
    scope: "IRON"
  }
];
