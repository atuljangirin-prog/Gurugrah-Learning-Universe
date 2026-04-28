import { GAME_HEIGHT, GAME_WIDTH } from "./constants.js";
import { audio } from "./audio.js";

export function addSceneBackground(scene, theme = {}) {
  const accent = theme.accent || 0xff9b35;
  const secondary = theme.secondary || 0x3edaff;
  const dark = theme.dark || 0x080b1d;
  scene.cameras.main.setBackgroundColor(dark);

  const bg = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, `bg-${theme.id || "math"}`);
  bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setScrollFactor(0);

  const glowA = scene.add.circle(170, 110, 110, accent, 0.13).setBlendMode(Phaser.BlendModes.ADD).setScrollFactor(0);
  const glowB = scene.add.circle(1080, 146, 160, secondary, 0.12).setBlendMode(Phaser.BlendModes.ADD).setScrollFactor(0);
  const glowC = scene.add.circle(635, 690, 175, 0xffffff, 0.04).setBlendMode(Phaser.BlendModes.ADD).setScrollFactor(0);

  scene.tweens.add({
    targets: [glowA, glowB, glowC],
    alpha: { from: 0.08, to: 0.18 },
    scale: { from: 0.96, to: 1.06 },
    duration: 2600,
    ease: "Sine.easeInOut",
    yoyo: true,
    repeat: -1
  });

  return bg;
}

export function addGlassPanel(scene, x, y, width, height, options = {}) {
  const radius = options.radius ?? 20;
  const fill = options.fill ?? 0xffffff;
  const alpha = options.alpha ?? 0.1;
  const container = scene.add.container(x, y);
  const g = scene.add.graphics();

  g.fillStyle(0x000000, options.shadowAlpha ?? 0.28);
  g.fillRoundedRect(-width / 2 + 8, -height / 2 + 12, width, height, radius);
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
  g.fillStyle(0xffffff, 0.045);
  g.fillRoundedRect(-width / 2 + 10, -height / 2 + 10, width - 20, Math.max(16, height * 0.2), radius * 0.72);
  g.lineStyle(options.borderWidth ?? 1.5, 0xffffff, options.borderAlpha ?? 0.24);
  g.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);

  container.add(g);
  container.setSize(width, height);
  return container;
}

export function addPremiumButton(scene, x, y, width, height, label, onClick, options = {}) {
  const variant = options.variant || "warm";
  const textureKey = variant === "cool" ? "button-cool" : variant === "ghost" ? "button-ghost" : "button-warm";
  const container = scene.add.container(x, y);
  const glowColor = variant === "warm" ? 0xff4f94 : 0x3edaff;
  const glow = scene.add.rectangle(0, 6, width * 0.92, height * 0.82, glowColor, 0.18);
  const bg = scene.add.image(0, 0, textureKey).setDisplaySize(width, height);
  const text = scene.add
    .text(0, -1, label, {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: `${options.fontSize || 25}px`,
      fontStyle: "700",
      color: "#ffffff",
      align: "center"
    })
    .setOrigin(0.5);
  const hit = scene.add.rectangle(0, 0, width + 18, height + 18, 0xffffff, 0.001);

  glow.setBlendMode(Phaser.BlendModes.ADD);
  container.add([glow, bg, text, hit]);
  container.setSize(width, height);
  container.background = bg;
  container.label = text;
  let pressed = false;
  let locked = false;
  const activate = () => {
    if (locked) {
      return;
    }

    locked = true;
    void audio.unlock();
    audio.playSfx("select");
    onClick?.();
    scene.time.delayedCall(260, () => {
      locked = false;
    });
  };

  hit.setInteractive({ useHandCursor: true });
  hit.on("pointerover", () => {
    scene.tweens.add({ targets: container, scale: 1.05, duration: 170, ease: "Sine.easeOut" });
    scene.tweens.add({ targets: glow, alpha: 0.34, duration: 170, ease: "Sine.easeOut" });
  });

  hit.on("pointerout", () => {
    pressed = false;
    scene.tweens.add({ targets: container, scale: 1, duration: 190, ease: "Sine.easeOut" });
    scene.tweens.add({ targets: glow, alpha: 0.18, duration: 190, ease: "Sine.easeOut" });
  });

  hit.on("pointerdown", () => {
    pressed = true;
    scene.tweens.add({ targets: container, scale: 0.95, duration: 90, ease: "Sine.easeOut" });
    activate();
  });

  hit.on("pointerup", () => {
    pressed = false;
    scene.tweens.add({ targets: container, scale: 1.03, duration: 90, yoyo: true, ease: "Sine.easeOut" });
  });

  return container;
}

export function addIconButton(scene, x, y, label, onClick, options = {}) {
  const size = options.size || 58;
  const container = addGlassPanel(scene, x, y, size, size, { radius: 18, alpha: 0.13, shadowAlpha: 0.2 });
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: `${options.fontSize || 20}px`,
      fontStyle: "800",
      color: "#ffffff"
    })
    .setOrigin(0.5);
  const hit = scene.add.rectangle(0, 0, size + 18, size + 18, 0xffffff, 0.001);

  container.add([text, hit]);
  hit.setInteractive({ useHandCursor: true });
  hit.on("pointerover", () => scene.tweens.add({ targets: container, scale: 1.05, duration: 170, ease: "Sine.easeOut" }));
  hit.on("pointerout", () => scene.tweens.add({ targets: container, scale: 1, duration: 170, ease: "Sine.easeOut" }));
  hit.on("pointerdown", () => {
    scene.tweens.add({ targets: container, scale: 0.95, duration: 70, ease: "Sine.easeOut" });
    void audio.unlock();
    audio.playSfx("select");
    onClick?.();
  });
  hit.on("pointerup", () => scene.tweens.add({ targets: container, scale: 1, duration: 120, ease: "Sine.easeOut" }));
  return container;
}

export function addProgressBar(scene, x, y, width, height, color = 0x3edaff) {
  const container = addGlassPanel(scene, x, y, width, height, { radius: height / 2, alpha: 0.09, shadowAlpha: 0.12 });
  const fill = scene.add.rectangle(-width / 2 + 5, 0, 1, height - 10, color, 0.95).setOrigin(0, 0.5);
  const shine = scene.add.rectangle(-width / 2 + 5, -height * 0.1, 1, Math.max(2, height * 0.18), 0xffffff, 0.24).setOrigin(0, 0.5);
  container.add([fill, shine]);

  return {
    container,
    setValue(value) {
      const next = Phaser.Math.Clamp(value, 0, 1);
      fill.width = Math.max(1, (width - 10) * next);
      shine.width = fill.width;
    }
  };
}

export function transitionTo(scene, key, data = {}) {
  if (scene.__transitioning) {
    return;
  }

  scene.__transitioning = true;
  const unlockTransition = () => {
    scene.__transitioning = false;
  };

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, unlockTransition);
  scene.cameras.main.fadeOut(260, 0, 0, 0);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, unlockTransition);
    unlockTransition();
    scene.scene.start(key, data);
  });
}

export function createTitle(scene, x, y, text, size = 64) {
  const shadow = scene.add.text(x + 4, y + 6, text, {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: `${size}px`,
    fontStyle: "900",
    color: "#000000",
    align: "center"
  }).setOrigin(0.5).setAlpha(0.32);

  const title = scene.add.text(x, y, text, {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: `${size}px`,
    fontStyle: "900",
    color: "#ffffff",
    align: "center"
  }).setOrigin(0.5);

  return scene.add.container(0, 0, [shadow, title]);
}

export function shuffle(array) {
  return Phaser.Utils.Array.Shuffle([...array]);
}

export function isTouchDevice() {
  return window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
}
