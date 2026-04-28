import { DEFAULT_RUN, GAME_HEIGHT, GAME_WIDTH, WORLD_THEMES } from "../utils/constants.js";
import { ensureLandscapeFullscreenOnMobile, toggleFullscreen } from "../utils/fullscreen.js";
import { addGlassPanel, addIconButton, addPremiumButton, addSceneBackground, transitionTo } from "../utils/ui.js";

const CARD_W = 500;
const CARD_H = 178;

export default class WorldScene extends Phaser.Scene {
  constructor() {
    super("WorldScene");
  }

  init(data) {
    this.quickStart = Boolean(data?.quickStart);
  }

  create() {
    const levels = this.cache.json.get("levels");
    addSceneBackground(this, WORLD_THEMES.science);
    this.cameras.main.fadeIn(320, 0, 0, 0);

    this.add.text(GAME_WIDTH / 2, 74, "Select World", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "46px",
      fontStyle: "900",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 118, "Each world blends platforming, checkpoints, and adaptive questions.", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px",
      color: "rgba(255,255,255,0.68)"
    }).setOrigin(0.5);

    const positions = [
      [348, 260],
      [932, 260],
      [348, 476],
      [932, 476]
    ];

    levels.worlds.forEach((world, index) => {
      this.createWorldCard(world, positions[index][0], positions[index][1]);
    });

    addPremiumButton(this, GAME_WIDTH / 2, 654, 260, 58, "Back to Menu", () => transitionTo(this, "MenuScene"), {
      variant: "ghost",
      fontSize: 20
    });
    addIconButton(this, GAME_WIDTH - 82, 58, "FS", () => toggleFullscreen(), { size: 58, fontSize: 18 });
  }

  createWorldCard(world, x, y) {
    const theme = WORLD_THEMES[world.id];
    const levels = this.cache.json.get("levels").levels.filter((level) => level.worldId === world.id).length;
    const card = addGlassPanel(this, x, y, CARD_W, CARD_H, { alpha: 0.12, shadowAlpha: 0.3 });
    const accent = this.add.rectangle(-CARD_W / 2 + 7, 0, 9, CARD_H - 28, theme.accent, 0.92);
    const orb = this.add.circle(-CARD_W / 2 + 74, -38, 34, theme.accent, 0.9).setBlendMode(Phaser.BlendModes.ADD);
    const name = this.add.text(-CARD_W / 2 + 124, -58, world.name, {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "28px",
      fontStyle: "900",
      color: "#ffffff"
    }).setOrigin(0, 0.5);
    const desc = this.add.text(-CARD_W / 2 + 124, -18, world.description, {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px",
      color: "rgba(255,255,255,0.72)",
      wordWrap: { width: 330, useAdvancedWrap: true },
      lineSpacing: 4
    }).setOrigin(0, 0.5);
    const meta = this.add.text(-CARD_W / 2 + 124, 54, `${levels} levels - adaptive quests`, {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "15px",
      fontStyle: "800",
      color: "#ffffff"
    }).setOrigin(0, 0.5);

    const hit = this.add.rectangle(0, 0, CARD_W + 18, CARD_H + 18, 0xffffff, 0.001);
    card.add([accent, orb, name, desc, meta, hit]);
    let locked = false;
    hit.setInteractive({ useHandCursor: true });
    hit.on("pointerover", () => this.tweens.add({ targets: card, scale: 1.035, duration: 180, ease: "Sine.easeOut" }));
    hit.on("pointerout", () => this.tweens.add({ targets: card, scale: 1, duration: 180, ease: "Sine.easeOut" }));
    hit.on("pointerdown", () => {
      if (locked) {
        return;
      }

      locked = true;
      void ensureLandscapeFullscreenOnMobile();
      transitionTo(this, "GameScene", {
        worldId: world.id,
        levelIndex: 0,
        runState: { ...DEFAULT_RUN, worldId: world.id }
      });
    });
  }
}
