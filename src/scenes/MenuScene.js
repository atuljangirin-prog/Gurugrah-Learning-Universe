import { GAME_HEIGHT, GAME_WIDTH, WORLD_THEMES } from "../utils/constants.js";
import { audio } from "../utils/audio.js";
import { ensureLandscapeFullscreenOnMobile, toggleFullscreen } from "../utils/fullscreen.js";
import { addGlassPanel, addIconButton, addPremiumButton, addSceneBackground, createTitle, transitionTo } from "../utils/ui.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    addSceneBackground(this, WORLD_THEMES.math);
    this.cameras.main.fadeIn(360, 0, 0, 0);

    this.createAmbientParticles();
    createTitle(this, GAME_WIDTH / 2, 112, "Gurugrah Learning Universe", 58);
    this.add.text(GAME_WIDTH / 2, 166, "A side-scrolling adventure where every jump makes learning stick", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "20px",
      color: "rgba(255,255,255,0.76)",
      align: "center"
    }).setOrigin(0.5);

    const panel = addGlassPanel(this, GAME_WIDTH / 2, 414, 520, 410, { alpha: 0.12, shadowAlpha: 0.34 });
    this.add.text(GAME_WIDTH / 2, 246, "Choose Your Launch", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "24px",
      fontStyle: "800",
      color: "#ffffff"
    }).setOrigin(0.5);

    const start = addPremiumButton(this, GAME_WIDTH / 2, 312, 360, 70, "Start Game", async () => {
      void audio.startMusic();
      void ensureLandscapeFullscreenOnMobile();
      transitionTo(this, "WorldScene", { quickStart: true });
    }, { variant: "warm" });

    const select = addPremiumButton(this, GAME_WIDTH / 2, 394, 360, 64, "Select World", () => {
      transitionTo(this, "WorldScene");
    }, { variant: "cool", fontSize: 22 });

    const board = addPremiumButton(this, GAME_WIDTH / 2, 468, 360, 58, "Leaderboard", () => {
      transitionTo(this, "LeaderboardScene");
    }, { variant: "ghost", fontSize: 20 });

    const settings = addPremiumButton(this, GAME_WIDTH / 2, 536, 360, 58, "Settings", () => {
      transitionTo(this, "SettingsScene");
    }, { variant: "ghost", fontSize: 20 });

    addIconButton(this, GAME_WIDTH - 82, 58, "FS", () => toggleFullscreen(), { size: 58, fontSize: 18 });

    this.add.text(GAME_WIDTH / 2, 670, "Math - Science - Coding - Quiz Arena", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px",
      fontStyle: "700",
      color: "rgba(255,255,255,0.56)"
    }).setOrigin(0.5);
  }

  createAmbientParticles() {
    const particles = this.add.particles(0, 0, "spark", {
      x: { min: 0, max: GAME_WIDTH },
      y: { min: 0, max: GAME_HEIGHT },
      speed: { min: 4, max: 18 },
      angle: { min: 210, max: 330 },
      lifespan: { min: 2800, max: 5200 },
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.42, end: 0 },
      quantity: 1,
      frequency: 280,
      blendMode: Phaser.BlendModes.ADD
    });
    particles.setDepth(-1);
  }
}
