import { GAME_HEIGHT, GAME_WIDTH } from "./utils/constants.js";

const PHASER_SOURCES = [
  "https://cdn.jsdelivr.net/npm/phaser@4.0.0/dist/phaser.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/phaser/4.0.0/phaser.min.js"
];
const APP_VERSION = "2026-04-28-final-polish-5";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

async function loadPhaser() {
  if (window.Phaser) {
    return window.Phaser;
  }

  for (const source of PHASER_SOURCES) {
    try {
      await loadScript(source);
      if (window.Phaser) {
        return window.Phaser;
      }
    } catch {
      // Try the next official CDN mirror.
    }
  }

  throw new Error("Phaser 4.0.0 could not be loaded. Check the network connection and reload.");
}

function showBootError(error) {
  const container = document.getElementById("game-container");
  container.innerHTML = `
    <div style="
      width:min(88vw, 620px);
      padding:32px;
      color:#fff;
      background:rgba(255,255,255,0.1);
      backdrop-filter:blur(10px);
      border:1px solid rgba(255,255,255,0.22);
      border-radius:20px;
      box-shadow:0 24px 70px rgba(0,0,0,0.45);
      text-align:center;
      font:600 18px Inter, Arial, sans-serif;
    ">
      <h1 style="margin:0 0 12px;font-size:30px;">Unable to Start Game</h1>
      <p style="margin:0;color:rgba(255,255,255,0.76);line-height:1.5;">${error.message}</p>
    </div>`;
}

async function createGame() {
  await loadPhaser();

  const [
    { default: BootScene },
    { default: MenuScene },
    { default: WorldScene },
    { default: GameScene },
    { default: UIScene },
    { default: GameOverScene },
    { default: LeaderboardScene },
    { default: SettingsScene }
  ] = await Promise.all([
    import(`./scenes/BootScene.js?v=${APP_VERSION}`),
    import(`./scenes/MenuScene.js?v=${APP_VERSION}`),
    import(`./scenes/WorldScene.js?v=${APP_VERSION}`),
    import(`./scenes/GameScene.js?v=${APP_VERSION}`),
    import(`./scenes/UIScene.js?v=${APP_VERSION}`),
    import(`./scenes/GameOverScene.js?v=${APP_VERSION}`),
    import(`./scenes/LeaderboardScene.js?v=${APP_VERSION}`),
    import(`./scenes/SettingsScene.js?v=${APP_VERSION}`)
  ]);

  const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#080b1d",
    render: {
      antialias: true,
      pixelArt: false,
      powerPreference: "high-performance",
      roundPixels: true
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      fullscreenTarget: "game-shell"
    },
    input: {
      activePointers: 4
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 1350 },
        debug: false,
        fps: 60
      }
    },
    fps: {
      target: 60,
      smoothStep: true,
      forceSetTimeOut: false
    },
    scene: [
      BootScene,
      MenuScene,
      WorldScene,
      GameScene,
      UIScene,
      GameOverScene,
      LeaderboardScene,
      SettingsScene
    ]
  };

  window.gurugrahGame = new Phaser.Game(config);
}

window.addEventListener("load", () => {
  createGame().catch(showBootError);
});
