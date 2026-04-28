import { DEFAULT_RUN, GAME_HEIGHT, GAME_WIDTH, WORLD_THEMES } from "../utils/constants.js";
import { loadSettings } from "../utils/storage.js";

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function makeCanvasTexture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) {
    return;
  }
  const texture = scene.textures.createCanvas(key, width, height);
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, width, height);
  draw(ctx, width, height);
  texture.refresh();
}

function drawButton(ctx, width, height, colors, border = "rgba(255,255,255,0.28)") {
  const glow = ctx.createLinearGradient(0, 0, width, height);
  glow.addColorStop(0, colors[0]);
  glow.addColorStop(1, colors[1]);
  ctx.shadowColor = colors[1];
  ctx.shadowBlur = 28;
  roundedRect(ctx, 18, 18, width - 36, height - 32, 24);
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.shadowBlur = 0;
  const shine = ctx.createLinearGradient(0, 10, 0, height * 0.5);
  shine.addColorStop(0, "rgba(255,255,255,0.38)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  roundedRect(ctx, 28, 24, width - 56, height * 0.36, 18);
  ctx.fillStyle = shine;
  ctx.fill();
  roundedRect(ctx, 18, 18, width - 36, height - 32, 24);
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawHero(ctx, width, height, pose, step = 0) {
  ctx.save();
  ctx.translate(width / 2, height / 2 + 2);
  const bob = pose === "run" ? Math.sin(step * Math.PI) * 3 : pose === "idle" ? Math.sin(step * Math.PI) * 2 : 0;
  ctx.translate(0, bob);

  ctx.shadowColor = "rgba(56,216,255,0.7)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#38d8ff";
  roundedRect(ctx, -21, -8, 42, 44, 16);
  ctx.fill();
  ctx.shadowBlur = 0;

  const visor = ctx.createLinearGradient(-14, -29, 15, -16);
  visor.addColorStop(0, "#fff5c8");
  visor.addColorStop(1, "#66f7ff");
  ctx.fillStyle = "#161a36";
  ctx.beginPath();
  ctx.arc(0, -25, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = visor;
  roundedRect(ctx, -14, -31, 29, 13, 7);
  ctx.fill();

  ctx.strokeStyle = "#ff9b35";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-18, 6);
  ctx.lineTo(-32, 18 + (pose === "run" ? step * 6 : 0));
  ctx.moveTo(18, 6);
  ctx.lineTo(31, 16 - (pose === "run" ? step * 5 : 0));
  ctx.stroke();

  const legSpread = pose === "run" ? 12 : pose === "jump" ? 5 : pose === "fall" ? 8 : 3;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-10, 31);
  ctx.lineTo(-10 - legSpread * (step > 0 ? 1 : -1), 44);
  ctx.moveTo(10, 31);
  ctx.lineTo(10 + legSpread * (step > 0 ? 1 : -1), 44);
  ctx.stroke();

  ctx.restore();
}

function drawEnemy(ctx, width, height) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.shadowColor = "rgba(255,63,143,0.7)";
  ctx.shadowBlur = 16;
  const body = ctx.createLinearGradient(-28, -18, 28, 20);
  body.addColorStop(0, "#ff3f8f");
  body.addColorStop(1, "#6730ff");
  roundedRect(ctx, -28, -18, 56, 38, 14);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#080b1d";
  roundedRect(ctx, -16, -8, 32, 14, 7);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-7, -1, 3, 0, Math.PI * 2);
  ctx.arc(8, -1, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(-22, 19, 5, 0, Math.PI * 2);
  ctx.arc(22, 19, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCoin(ctx, width, height, frame) {
  const scale = 0.28 + Math.abs(Math.cos((frame / 6) * Math.PI)) * 0.72;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(scale, 1);
  const gradient = ctx.createRadialGradient(-6, -7, 2, 0, 0, 20);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.25, "#fff0a8");
  gradient.addColorStop(1, "#ff9b35");
  ctx.shadowColor = "rgba(255,209,102,0.9)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#8f4b00";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawPower(ctx, width, height, type) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  const color = type === "shield" ? "#42f5b9" : "#ff9b35";
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = type === "shield" ? "rgba(66,245,185,0.9)" : "rgba(255,155,53,0.92)";
  if (type === "shield") {
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(21, -12);
    ctx.lineTo(16, 18);
    ctx.lineTo(0, 28);
    ctx.lineTo(-16, 18);
    ctx.lineTo(-21, -12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(4, -28);
    ctx.lineTo(-16, 4);
    ctx.lineTo(3, 4);
    ctx.lineTo(-5, 28);
    ctx.lineTo(18, -5);
    ctx.lineTo(0, -5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCheckpoint(ctx, width, height) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.shadowColor = "rgba(62,218,255,0.9)";
  ctx.shadowBlur = 20;
  const gradient = ctx.createLinearGradient(0, -32, 0, 34);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.28, "#66f7ff");
  gradient.addColorStop(1, "#674dff");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(25, -2);
  ctx.lineTo(9, 34);
  ctx.lineTo(-18, 28);
  ctx.lineTo(-25, -3);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawPortal(ctx, width, height) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.shadowColor = "rgba(66,245,185,0.95)";
  ctx.shadowBlur = 24;
  const gradient = ctx.createRadialGradient(0, 0, 8, 0, 0, 42);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.25, "#42f5b9");
  gradient.addColorStop(0.72, "#38d8ff");
  gradient.addColorStop(1, "rgba(56,216,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, 33, 48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const bar = this.add.graphics();
    const shell = this.add.graphics();
    const title = this.add.text(GAME_WIDTH / 2, 278, "Gurugrah Learning Universe", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "46px",
      fontStyle: "900",
      color: "#ffffff"
    }).setOrigin(0.5);
    const label = this.add.text(GAME_WIDTH / 2, 354, "Preparing learning worlds", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "20px",
      color: "rgba(255,255,255,0.72)"
    }).setOrigin(0.5);

    shell.fillStyle(0xffffff, 0.1);
    shell.fillRoundedRect(390, 406, 500, 18, 9);
    shell.lineStyle(1, 0xffffff, 0.22);
    shell.strokeRoundedRect(390, 406, 500, 18, 9);

    this.load.on("progress", (value) => {
      bar.clear();
      bar.fillStyle(0x3edaff, 0.95);
      bar.fillRoundedRect(394, 410, 492 * value, 10, 5);
    });

    this.load.json("questions", "./data/questions.json");
    this.load.json("levels", "./data/levels.json");

    this.load.once("complete", () => {
      this.tweens.add({ targets: [title, label, bar, shell], alpha: 0, duration: 260, ease: "Sine.easeInOut" });
    });
  }

  create() {
    this.registry.set("settings", loadSettings());
    this.registry.set("controls", { left: false, right: false, jump: false });
    this.createGeneratedTextures();
    this.createAnimations();

    this.cameras.main.fadeIn(320, 0, 0, 0);
    this.time.delayedCall(280, () => {
      const params = new URLSearchParams(window.location.search);
      const worldId = params.get("world");
      if (worldId && WORLD_THEMES[worldId]) {
        this.scene.start("GameScene", {
          worldId,
          levelIndex: 0,
          runState: { ...DEFAULT_RUN, worldId }
        });
        return;
      }

      this.scene.start("MenuScene");
    });
  }

  createGeneratedTextures() {
    makeCanvasTexture(this, "button-warm", 460, 108, (ctx, w, h) => {
      drawButton(ctx, w, h, ["#ff9b35", "#ff3f8f"]);
    });

    makeCanvasTexture(this, "button-cool", 460, 108, (ctx, w, h) => {
      drawButton(ctx, w, h, ["#3a7bff", "#3edaff"]);
    });

    makeCanvasTexture(this, "button-ghost", 460, 108, (ctx, w, h) => {
      drawButton(ctx, w, h, ["rgba(255,255,255,0.13)", "rgba(255,255,255,0.06)"], "rgba(255,255,255,0.34)");
    });

    Object.values(WORLD_THEMES).forEach((theme) => {
      makeCanvasTexture(this, `bg-${theme.id}`, GAME_WIDTH, GAME_HEIGHT, (ctx, w, h) => {
        const gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, `#${theme.dark.toString(16).padStart(6, "0")}`);
        gradient.addColorStop(0.52, "#111936");
        gradient.addColorStop(1, "#080b1d");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 84; i += 1) {
          const x = (i * 137) % w;
          const y = (i * 97) % h;
          const r = 1 + (i % 3);
          ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.22)" : "rgba(62,218,255,0.22)";
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    makeCanvasTexture(this, "platform", 192, 40, (ctx, w, h) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, "#465177");
      gradient.addColorStop(1, "#111936");
      roundedRect(ctx, 0, 0, w, h, 10);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      roundedRect(ctx, 6, 5, w - 12, 8, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ["idle", "run", "jump", "fall"].forEach((pose) => {
      const count = pose === "run" ? 6 : 2;
      for (let i = 0; i < count; i += 1) {
        makeCanvasTexture(this, `hero-${pose}-${i}`, 72, 96, (ctx, w, h) => drawHero(ctx, w, h, pose, i % 2 ? 1 : -1));
      }
    });

    makeCanvasTexture(this, "enemy", 70, 56, drawEnemy);
    makeCanvasTexture(this, "checkpoint", 70, 86, drawCheckpoint);
    makeCanvasTexture(this, "portal", 104, 132, drawPortal);
    makeCanvasTexture(this, "power-speed", 64, 64, (ctx, w, h) => drawPower(ctx, w, h, "speed"));
    makeCanvasTexture(this, "power-shield", 64, 64, (ctx, w, h) => drawPower(ctx, w, h, "shield"));

    for (let i = 0; i < 6; i += 1) {
      makeCanvasTexture(this, `coin-${i}`, 42, 42, (ctx, w, h) => drawCoin(ctx, w, h, i));
    }

    makeCanvasTexture(this, "spark", 16, 16, (ctx, w, h) => {
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, 7);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.48, "#ffd166");
      gradient.addColorStop(1, "rgba(255,209,102,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    });

    makeCanvasTexture(this, "green-dot", 18, 18, (ctx, w, h) => {
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, 8);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.5, "#42f5b9");
      gradient.addColorStop(1, "rgba(66,245,185,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    });

    makeCanvasTexture(this, "red-dot", 18, 18, (ctx, w, h) => {
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, 8);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.48, "#ff3f8f");
      gradient.addColorStop(1, "rgba(255,63,143,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    });

    makeCanvasTexture(this, "dust", 20, 14, (ctx, w, h) => {
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  createAnimations() {
    if (this.anims.exists("hero-idle")) {
      return;
    }

    this.anims.create({
      key: "hero-idle",
      frames: [{ key: "hero-idle-0" }, { key: "hero-idle-1" }],
      frameRate: 3,
      repeat: -1
    });

    this.anims.create({
      key: "hero-run",
      frames: [0, 1, 2, 3, 4, 5].map((index) => ({ key: `hero-run-${index}` })),
      frameRate: 12,
      repeat: -1
    });

    this.anims.create({
      key: "hero-jump",
      frames: [{ key: "hero-jump-0" }, { key: "hero-jump-1" }],
      frameRate: 4,
      repeat: -1
    });

    this.anims.create({
      key: "hero-fall",
      frames: [{ key: "hero-fall-0" }, { key: "hero-fall-1" }],
      frameRate: 4,
      repeat: -1
    });

    this.anims.create({
      key: "coin-spin",
      frames: [0, 1, 2, 3, 4, 5].map((index) => ({ key: `coin-${index}` })),
      frameRate: 10,
      repeat: -1
    });
  }
}
