import { GAME_HEIGHT, GAME_WIDTH, WORLD_THEMES } from "../utils/constants.js";
import { audio } from "../utils/audio.js";
import { toggleFullscreen } from "../utils/fullscreen.js";
import { addGlassPanel, addIconButton, addPremiumButton, addProgressBar, isTouchDevice, shuffle } from "../utils/ui.js";

export default class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  init(data) {
    this.worldId = data?.worldId || "math";
    this.levelIndex = data?.levelIndex || 0;
    this.levelName = data?.levelName || "";
  }

  create() {
    this.theme = WORLD_THEMES[this.worldId] || WORLD_THEMES.math;
    this.controls = { left: false, right: false, jump: false };
    this.registry.set("controls", this.controls);
    this.buildHud();
    this.buildMobileControls();
    this.game.events.on("hud:update", this.updateHud, this);
    this.game.events.on("quiz:show", this.showQuiz, this);
    this.events.once("shutdown", () => {
      this.game.events.off("hud:update", this.updateHud, this);
      this.game.events.off("quiz:show", this.showQuiz, this);
      this.registry.set("controls", { left: false, right: false, jump: false });
    });
  }

  buildHud() {
    this.scorePanel = addGlassPanel(this, 184, 52, 310, 72, { alpha: 0.11, shadowAlpha: 0.24, radius: 20 });
    this.scorePanel.setDepth(25);
    this.healthDots = [];
    for (let i = 0; i < 3; i += 1) {
      const dot = this.add.circle(-118 + i * 30, -17, 10, 0xff3f8f, 0.95);
      const shine = this.add.circle(-121 + i * 30, -20, 3, 0xffffff, 0.38);
      this.scorePanel.add([dot, shine]);
      this.healthDots.push(dot);
    }

    this.scoreText = this.add.text(-20, -17, "Score 0", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "19px",
      fontStyle: "900",
      color: "#ffffff"
    }).setOrigin(0, 0.5);

    this.knowledgeText = this.add.text(-118, 18, "KP 0 - Coins 0", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px",
      fontStyle: "800",
      color: "rgba(255,255,255,0.7)"
    }).setOrigin(0, 0.5);

    this.scorePanel.add([this.scoreText, this.knowledgeText]);

    this.levelPanel = addGlassPanel(this, 570, 52, 410, 72, { alpha: 0.11, shadowAlpha: 0.24, radius: 20 });
    this.levelPanel.setDepth(25);
    this.levelText = this.add.text(-182, -15, this.levelName, {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px",
      fontStyle: "900",
      color: "#ffffff",
      fixedWidth: 364
    }).setOrigin(0, 0.5);

    this.powerText = this.add.text(-182, 18, "Power none", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "15px",
      color: "rgba(255,255,255,0.68)"
    }).setOrigin(0, 0.5);

    this.levelPanel.add([this.levelText, this.powerText]);
    this.progress = addProgressBar(this, 970, 52, 300, 32, this.theme.secondary);
    this.progress.container.setDepth(25);
    this.progress.setValue(0);
    addIconButton(this, GAME_WIDTH - 50, 52, "FS", () => toggleFullscreen(), { size: 54, fontSize: 16 }).setDepth(26);
  }

  buildMobileControls() {
    const needsTouchControls = isTouchDevice() || window.innerWidth <= 1100 || window.innerHeight <= 640;
    if (!needsTouchControls) {
      return;
    }

    this.touchPointers = { left: null, right: null, jump: null };
    this.addTouchButton(92, GAME_HEIGHT - 86, 82, "L", "left");
    this.addTouchButton(196, GAME_HEIGHT - 86, 82, "R", "right");
    this.addTouchButton(GAME_WIDTH - 120, GAME_HEIGHT - 92, 96, "JUMP", "jump", 18);
    this.input.on("pointerup", (pointer) => this.releaseTouchPointer(pointer));
    this.input.on("pointerupoutside", (pointer) => this.releaseTouchPointer(pointer));
  }

  addTouchButton(x, y, size, label, key, fontSize = 24) {
    const button = addGlassPanel(this, x, y, size, size, { radius: size / 2, alpha: 0.14, shadowAlpha: 0.22 });
    const text = this.add.text(0, 0, label, {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: `${fontSize}px`,
      fontStyle: "900",
      color: "#ffffff"
    }).setOrigin(0.5);
    button.add(text);
    button.setDepth(35);
    const hit = this.add.rectangle(0, 0, size + 30, size + 30, 0xffffff, 0.001);
    button.add(hit);
    hit.setInteractive({ useHandCursor: true });
    hit.on("pointerdown", (pointer) => {
      this.touchPointers[key] = pointer.id;
      this.setControl(key, true);
      this.tweens.add({ targets: button, scale: 0.94, duration: 80, ease: "Sine.easeOut" });
    });
    const release = (pointer) => {
      this.releaseTouchPointer(pointer, key);
      this.tweens.add({ targets: button, scale: 1, duration: 90, ease: "Sine.easeOut" });
    };
    hit.on("pointerup", release);
    hit.on("pointerout", release);
    hit.on("pointercancel", release);
    return button;
  }

  releaseTouchPointer(pointer, key = null) {
    const pointerId = pointer?.id;
    const keys = key ? [key] : Object.keys(this.touchPointers || {});

    keys.forEach((controlKey) => {
      if (this.touchPointers?.[controlKey] === pointerId || key === controlKey) {
        this.touchPointers[controlKey] = null;
        this.setControl(controlKey, false);
      }
    });
  }

  setControl(key, value) {
    this.controls[key] = value;
    this.registry.set("controls", { ...this.controls });
  }

  updateHud(run) {
    if (!run) {
      return;
    }

    this.scoreText.setText(`Score ${run.score}`);
    this.knowledgeText.setText(`KP ${run.knowledge} - Coins ${run.coins}`);
    this.levelText.setText(run.levelName || this.levelName);
    this.powerText.setText(`Power ${run.power || "none"}`);
    this.progress.setValue(run.progress || 0);

    this.healthDots.forEach((dot, index) => {
      dot.setFillStyle(index < run.lives ? 0xff3f8f : 0x39405f, index < run.lives ? 0.95 : 0.55);
      dot.setScale(index < run.lives ? 1 : 0.86);
    });
  }

  showQuiz(payload) {
    if (this.quizContainer) {
      this.quizContainer.destroy(true);
    }

    const question = payload.question;
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02030a, 0.58)
      .setInteractive()
      .setDepth(80);
    const modal = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(81).setAlpha(0).setScale(0.88);
    const panel = addGlassPanel(this, 0, 0, 880, 512, { alpha: 0.13, shadowAlpha: 0.42, radius: 20 });
    const label = this.add.text(-378, -202, `Checkpoint - Difficulty ${question.difficulty}`, {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px",
      fontStyle: "900",
      color: "#3edaff"
    }).setOrigin(0, 0.5);
    const prompt = this.add.text(-378, -142, question.question, {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "28px",
      fontStyle: "900",
      color: "#ffffff",
      wordWrap: { width: 760, useAdvancedWrap: true },
      lineSpacing: 6
    }).setOrigin(0, 0.5);
    const helper = this.add.text(-378, -56, "Choose the best answer to unlock a reward.", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px",
      color: "rgba(255,255,255,0.66)"
    }).setOrigin(0, 0.5);

    modal.add([panel, label, prompt, helper]);

    const answers = shuffle(question.answers.map((answer, index) => ({
      answer,
      correct: index === question.correctIndex
    })));

    answers.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const button = addPremiumButton(this, -210 + col * 420, 64 + row * 92, 360, 64, item.answer, () => {
        this.answerQuiz(item.correct, modal, overlay, button, question.explanation);
      }, {
        variant: index % 2 ? "cool" : "warm",
        fontSize: item.answer.length > 26 ? 17 : 19
      });
      modal.add(button);
    });

    this.quizContainer = modal;
    this.quizOverlay = overlay;
    this.tweens.add({ targets: modal, alpha: 1, scale: 1, duration: 220, ease: "Back.easeOut" });
  }

  answerQuiz(correct, modal, overlay, chosenButton, explanation) {
    if (this.answering) {
      return;
    }

    this.answering = true;
    const particleKey = correct ? "green-dot" : "red-dot";
    const emitter = this.add.particles(0, 0, particleKey, {
      speed: { min: 80, max: 260 },
      angle: { min: 0, max: 360 },
      lifespan: 560,
      scale: { start: 0.75, end: 0 },
      alpha: { start: 0.95, end: 0 },
      blendMode: Phaser.BlendModes.ADD,
      emitting: false
    }).setDepth(90);
    emitter.explode(correct ? 28 : 22, GAME_WIDTH / 2, GAME_HEIGHT / 2);

    if (!correct) {
      this.cameras.main.shake(220, 0.009);
    }

    chosenButton.background.setTint(correct ? 0x42f5b9 : 0xff3f8f);
    const feedback = this.add.text(0, 198, correct ? "Correct! Reward unlocked." : `Not quite. ${explanation}`, {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: correct ? "20px" : "17px",
      fontStyle: "800",
      color: correct ? "#42f5b9" : "#ffd1df",
      align: "center",
      wordWrap: { width: 720, useAdvancedWrap: true }
    }).setOrigin(0.5);
    modal.add(feedback);

    audio.playSfx(correct ? "correct" : "wrong");
    this.tweens.add({
      targets: modal,
      scale: correct ? 1.035 : 0.985,
      duration: 140,
      yoyo: true,
      ease: "Sine.easeInOut"
    });

    this.time.delayedCall(920, () => {
      this.tweens.add({
        targets: [modal, overlay],
        alpha: 0,
        scale: 0.92,
        duration: 180,
        ease: "Sine.easeInOut",
        onComplete: () => {
          emitter.destroy();
          modal.destroy(true);
          overlay.destroy();
          this.quizContainer = null;
          this.quizOverlay = null;
          this.answering = false;
          this.game.events.emit("quiz:answered", { correct });
        }
      });
    });
  }
}
