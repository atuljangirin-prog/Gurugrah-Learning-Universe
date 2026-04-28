import { DEFAULT_RUN, GAME_HEIGHT, GAME_WIDTH, WORLD_THEMES } from "../utils/constants.js";
import { audio } from "../utils/audio.js";

const WALK_SPEED = 350;
const BOOST_SPEED = 470;
const JUMP_VELOCITY = -930;
const COYOTE_TIME = 120;
const JUMP_BUFFER = 135;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cloneRun(run, worldId) {
  return { ...DEFAULT_RUN, ...run, worldId };
}

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.worldId = data?.worldId || "math";
    this.levelIndex = data?.levelIndex || 0;
    this.run = cloneRun(data?.runState, this.worldId);
  }

  create() {
    this.questions = this.cache.json.get("questions");
    const levelPack = this.cache.json.get("levels");
    this.worldLevels = levelPack.levels.filter((level) => level.worldId === this.worldId);
    this.level = this.worldLevels[this.levelIndex] || this.worldLevels[0];
    this.theme = WORLD_THEMES[this.worldId] || WORLD_THEMES.math;
    this.platformInfo = [];
    this.quizOpen = false;
    this.gameEnded = false;
    this.lastHudAt = 0;
    this.invulnerableUntil = 0;
    this.speedUntil = 0;
    this.shieldUntil = 0;
    this.mobileJumpLocked = false;
    this.lastGroundedAt = 0;
    this.lastJumpPressedAt = -999;

    audio.startMusic();
    this.createBackdrop();
    this.createLevelGeometry();
    this.createPlayer();
    this.createCollectibles();
    this.createEnemies();
    this.createPowerups();
    this.createCheckpoints();
    this.createPortal();
    this.createCollisions();
    this.createControls();

    this.cameras.main.setBounds(0, 0, this.level.length, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.1, -120, 66);
    this.cameras.main.fadeIn(320, 0, 0, 0);

    this.scene.launch("UIScene", {
      worldId: this.worldId,
      levelIndex: this.levelIndex,
      levelName: this.level.name
    });
    this.scene.bringToTop("UIScene");
    this.game.events.on("quiz:answered", this.handleQuizAnswered, this);
    this.events.once("shutdown", () => {
      this.game.events.off("quiz:answered", this.handleQuizAnswered, this);
      this.scene.stop("UIScene");
    });
    this.emitHud(true);
  }

  createBackdrop() {
    this.cameras.main.setBackgroundColor(this.theme.dark);
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, `bg-${this.worldId}`).setScrollFactor(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    for (let i = 0; i < Math.ceil(this.level.length / 520); i += 1) {
      const x = i * 520 + 180;
      const y = 120 + (i % 4) * 54;
      const ring = this.add.circle(x, y, 42 + (i % 3) * 10, i % 2 ? this.theme.secondary : this.theme.accent, 0.1);
      ring.setScrollFactor(0.18).setBlendMode(Phaser.BlendModes.ADD);
    }

    for (let i = 0; i < Math.ceil(this.level.length / 460); i += 1) {
      const bar = this.add.rectangle(i * 460 + 80, 600 - (i % 5) * 26, 240, 5, this.theme.secondary, 0.12);
      bar.setScrollFactor(0.34).setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  createLevelGeometry() {
    this.physics.world.setBounds(0, 0, this.level.length, GAME_HEIGHT + 240);
    this.platforms = this.physics.add.staticGroup();

    const groundTop = 676;
    for (let x = 96; x < this.level.length + 96; x += 190) {
      this.addPlatform(x, groundTop + 22, 196, 44);
    }

    this.level.platforms.forEach(([x, y, width]) => {
      this.addPlatform(x, y, width, 38);
    });
  }

  addPlatform(x, y, width, height = 38) {
    const platform = this.platforms.create(x, y, "platform");
    platform.setDisplaySize(width, height);
    platform.refreshBody();
    this.platformInfo.push({ x, y, width, height, top: y - height / 2 });
    return platform;
  }

  surfaceTopAt(x) {
    let top = 676;
    this.platformInfo.forEach((platform) => {
      const left = platform.x - platform.width / 2 - 12;
      const right = platform.x + platform.width / 2 + 12;
      if (x >= left && x <= right && platform.top < top) {
        top = platform.top;
      }
    });
    return top;
  }

  createPlayer() {
    this.player = this.physics.add.sprite(112, this.surfaceTopAt(112) - 64, "hero-idle-0");
    this.player.setSize(38, 70);
    this.player.setOffset(17, 21);
    this.player.setCollideWorldBounds(false);
    this.player.setDragX(1050);
    this.player.setMaxVelocity(560, 1180);
    this.player.play("hero-idle");
  }

  createCollectibles() {
    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });
    const count = this.level.coinCount;
    for (let i = 0; i < count; i += 1) {
      const x = 300 + (i + 0.35) * ((this.level.length - 620) / count);
      const y = this.surfaceTopAt(x) - 82 - (i % 3) * 18;
      const coin = this.coins.create(x, y, "coin-0");
      coin.body.setAllowGravity(false);
      coin.setCircle(18, 3, 3);
      coin.play("coin-spin");
      this.tweens.add({
        targets: coin,
        y: y - 9,
        duration: 900 + (i % 4) * 120,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1
      });
    }
  }

  createEnemies() {
    this.enemies = this.physics.add.group({ allowGravity: true, bounceX: 1 });
    for (let i = 0; i < this.level.enemyCount; i += 1) {
      const x = 580 + (i + 0.2) * ((this.level.length - 980) / this.level.enemyCount);
      const y = this.surfaceTopAt(x) - 46;
      const enemy = this.enemies.create(x, y, "enemy");
      enemy.setSize(54, 34);
      enemy.setOffset(8, 13);
      enemy.setBounce(1, 0);
      enemy.setCollideWorldBounds(true);
      enemy.setData("dir", i % 2 ? -1 : 1);
      enemy.setData("baseSpeed", this.level.enemySpeed + i * 4);
    }
  }

  createPowerups() {
    this.powerups = this.physics.add.group({ allowGravity: false, immovable: true });
    const placements = this.level.powerups || [];
    placements.forEach((type, index) => {
      const x = 780 + index * Math.max(520, this.level.length / (placements.length + 1));
      const y = this.surfaceTopAt(x) - 96;
      const powerup = this.powerups.create(x, y, `power-${type}`);
      powerup.body.setAllowGravity(false);
      powerup.setCircle(26, 6, 6);
      powerup.setData("type", type);
      this.tweens.add({
        targets: powerup,
        y: y - 12,
        scale: 1.08,
        duration: 1000,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1
      });
    });
  }

  createCheckpoints() {
    this.checkpoints = this.physics.add.group({ allowGravity: false, immovable: true });
    for (let i = 0; i < this.level.checkpointCount; i += 1) {
      const x = 620 + (i + 1) * ((this.level.length - 1250) / (this.level.checkpointCount + 1));
      const y = this.surfaceTopAt(x) - 80;
      const checkpoint = this.checkpoints.create(x, y, "checkpoint");
      checkpoint.body.setAllowGravity(false);
      checkpoint.setSize(48, 66);
      checkpoint.setOffset(11, 10);
      checkpoint.setData("used", false);
      checkpoint.setData("index", i);
      this.tweens.add({
        targets: checkpoint,
        angle: { from: -2, to: 2 },
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }
  }

  createPortal() {
    const x = this.level.length - 155;
    const y = this.surfaceTopAt(x) - 66;
    this.portal = this.physics.add.sprite(x, y, "portal");
    this.portal.body.setAllowGravity(false);
    this.portal.setImmovable(true);
    this.portal.setSize(58, 96);
    this.portal.setOffset(23, 17);
    this.tweens.add({
      targets: this.portal,
      scale: 1.08,
      angle: 3,
      duration: 1350,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.finishZone = this.add.zone(x, y, 150, 190);
    this.physics.add.existing(this.finishZone, true);
    this.add.text(x, y - 94, "FINISH", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px",
      fontStyle: "900",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(2);
  }

  createCollisions() {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);
    this.physics.add.overlap(this.player, this.checkpoints, this.enterCheckpoint, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.touchEnemy, null, this);
    this.physics.add.overlap(this.player, this.portal, this.completeLevel, null, this);
    this.physics.add.overlap(this.player, this.finishZone, this.completeLevel, null, this);
  }

  createControls() {
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.space = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update(time) {
    if (this.gameEnded) {
      return;
    }

    if (!this.quizOpen) {
      this.updatePlayer(time);
      this.updateEnemies(time);
    }

    if (this.player.y > GAME_HEIGHT + 150) {
      this.damagePlayer(0, true);
    }

    this.updatePowerState(time);
    this.emitHud(false, time);
  }

  updatePlayer(time) {
    const controls = this.registry.get("controls") || {};
    const left = this.cursors?.left?.isDown || controls.left;
    const right = this.cursors?.right?.isDown || controls.right;
    const jumpHeld = this.cursors?.up?.isDown || this.space?.isDown || controls.jump;
    const justPressedKeyboard = (this.cursors?.up && Phaser.Input.Keyboard.JustDown(this.cursors.up)) ||
      (this.space && Phaser.Input.Keyboard.JustDown(this.space));
    const justPressedTouch = controls.jump && !this.mobileJumpLocked;
    const onGround = this.player.body.blocked.down || this.player.body.onFloor();
    const speed = time < this.speedUntil ? BOOST_SPEED : WALK_SPEED;
    const jumpRequested = justPressedKeyboard || justPressedTouch;

    if (onGround) {
      this.lastGroundedAt = time;
    }

    if (jumpRequested) {
      this.lastJumpPressedAt = time;
    }

    let targetVelocity = 0;
    if (left) {
      targetVelocity = -speed;
      this.player.setFlipX(true);
    } else if (right) {
      targetVelocity = speed;
      this.player.setFlipX(false);
    }

    const blend = onGround ? 0.28 : 0.18;
    this.player.setVelocityX(Phaser.Math.Linear(this.player.body.velocity.x, targetVelocity, blend));

    if (jumpHeld) {
      this.mobileJumpLocked = true;
    } else {
      this.mobileJumpLocked = false;
    }

    const canUseCoyoteJump = time - this.lastGroundedAt <= COYOTE_TIME;
    const hasBufferedJump = time - this.lastJumpPressedAt <= JUMP_BUFFER;
    if (canUseCoyoteJump && hasBufferedJump) {
      this.lastGroundedAt = -999;
      this.lastJumpPressedAt = -999;
      this.player.setVelocityY(JUMP_VELOCITY);
      this.spawnParticles("dust", this.player.x, this.player.y + 38, 12, 0.5);
      audio.playSfx("jump");
    }

    if (!onGround && this.player.body.velocity.y < 0) {
      this.player.play("hero-jump", true);
    } else if (!onGround) {
      this.player.play("hero-fall", true);
    } else if (Math.abs(this.player.body.velocity.x) > 12) {
      this.player.play("hero-run", true);
    } else {
      this.player.play("hero-idle", true);
    }
  }

  updateEnemies(time) {
    const multiplier = this.currentDifficultyMultiplier(time);
    this.enemies.getChildren().forEach((enemy) => {
      if (!enemy?.active) {
        return;
      }

      let dir = enemy.getData("dir") || 1;
      const dx = this.player.x - enemy.x;
      if (Math.abs(dx) < 430 && Math.abs(this.player.y - enemy.y) < 120) {
        dir = Math.sign(dx) || dir;
      }
      if (enemy.body.blocked.left || enemy.body.blocked.right) {
        dir *= -1;
      }

      enemy.setData("dir", dir);
      enemy.setVelocityX(dir * enemy.getData("baseSpeed") * multiplier);
      enemy.setFlipX(dir < 0);
    });
  }

  currentDifficultyMultiplier(time = this.time.now) {
    const timeBonus = clamp(time / 100000, 0, 0.45);
    const runBonus = this.run.correct * 0.035 + this.levelIndex * 0.1;
    return 1 + timeBonus + runBonus;
  }

  updatePowerState(time) {
    if (time < this.shieldUntil) {
      this.run.power = "shield";
      this.player.setTint(0x42f5b9);
    } else if (time < this.speedUntil) {
      this.run.power = "speed";
      this.player.setTint(0xffd166);
    } else {
      this.run.power = "none";
      if (time > this.invulnerableUntil) {
        this.player.clearTint();
      }
    }
  }

  collectCoin(player, coin) {
    coin.disableBody(true, true);
    this.run.coins += 1;
    this.run.score += 10;
    this.run.knowledge += 1;
    this.spawnParticles("spark", coin.x, coin.y, 18, 0.65);
    audio.playSfx("coin");
    this.emitHud(true);
  }

  collectPowerup(player, powerup) {
    const type = powerup.getData("type");
    powerup.disableBody(true, true);
    if (type === "shield") {
      this.shieldUntil = this.time.now + 8500;
    } else {
      this.speedUntil = this.time.now + 8000;
    }
    this.run.score += 35;
    this.spawnParticles(type === "shield" ? "green-dot" : "spark", powerup.x, powerup.y, 24, 0.8);
    audio.playSfx("power");
    this.emitHud(true);
  }

  touchEnemy(player, enemy) {
    if (this.gameEnded || !enemy.active) {
      return;
    }

    if (this.time.now < this.shieldUntil) {
      this.defeatEnemy(enemy, true);
      return;
    }

    const stomp = player.body.velocity.y > 150 && player.y < enemy.y - 18;
    if (stomp) {
      this.defeatEnemy(enemy, false);
      player.setVelocityY(-420);
      return;
    }

    this.damagePlayer(enemy.x);
  }

  defeatEnemy(enemy, shielded) {
    this.spawnParticles(shielded ? "green-dot" : "spark", enemy.x, enemy.y, 22, 0.75);
    enemy.disableBody(true, true);
    this.run.score += shielded ? 35 : 60;
    this.run.knowledge += shielded ? 1 : 2;
    audio.playSfx(shielded ? "power" : "coin");
    this.emitHud(true);
  }

  damagePlayer(sourceX = 0, fromFall = false) {
    if (this.time.now < this.invulnerableUntil || this.gameEnded) {
      return;
    }

    this.run.lives -= 1;
    this.invulnerableUntil = this.time.now + 1450;
    this.player.setTint(0xff3f8f);
    this.cameras.main.shake(220, 0.008);
    this.spawnParticles("red-dot", this.player.x, this.player.y, 22, 0.7);
    audio.playSfx("hit");

    if (fromFall) {
      this.player.setPosition(Math.max(112, this.player.x - 160), this.surfaceTopAt(this.player.x) - 80);
      this.player.setVelocity(0, -200);
    } else {
      const push = this.player.x < sourceX ? -420 : 420;
      this.player.setVelocity(push, -360);
    }

    this.time.delayedCall(240, () => {
      if (this.time.now > this.shieldUntil) {
        this.player.clearTint();
      }
    });

    this.emitHud(true);
    if (this.run.lives <= 0) {
      this.finishRun(false);
    }
  }

  enterCheckpoint(player, checkpoint) {
    if (this.quizOpen || checkpoint.getData("used") || this.gameEnded) {
      return;
    }

    checkpoint.setData("used", true);
    this.activeCheckpoint = checkpoint;
    this.quizOpen = true;
    this.physics.pause();
    this.player.anims.pause();
    this.game.events.emit("quiz:show", {
      question: this.chooseQuestion(),
      worldId: this.worldId,
      difficulty: this.run.difficulty
    });
  }

  chooseQuestion() {
    const allQuestions = this.worldId === "quiz"
      ? Object.values(this.questions).flat()
      : this.questions[this.worldId] || this.questions.math;
    const targetDifficulty = clamp(Math.round(this.run.difficulty + this.levelIndex * 0.35), 1, 4);
    const candidates = allQuestions.filter((question) => question.difficulty <= targetDifficulty && question.difficulty >= targetDifficulty - 1);
    return Phaser.Utils.Array.GetRandom(candidates.length ? candidates : allQuestions);
  }

  handleQuizAnswered(result) {
    if (!this.quizOpen || this.gameEnded) {
      return;
    }

    this.quizOpen = false;
    this.physics.resume();
    this.player.anims.resume();
    this.run.answered += 1;

    if (result.correct) {
      this.run.correct += 1;
      this.run.score += 80 + Math.round(this.run.difficulty * 18);
      this.run.knowledge += 10 + Math.round(this.run.difficulty * 2);
      this.run.difficulty = clamp(this.run.difficulty + 0.24, 1, 4);
      this.spawnParticles("green-dot", this.activeCheckpoint?.x || this.player.x, this.activeCheckpoint?.y || this.player.y, 34, 0.9);
      audio.playSfx("correct");
      if (this.activeCheckpoint) {
        this.tweens.add({ targets: this.activeCheckpoint, alpha: 0.34, scale: 0.82, duration: 260, ease: "Sine.easeOut" });
      }
    } else {
      this.run.difficulty = clamp(this.run.difficulty + 0.08, 1, 4);
      this.run.lives -= 1;
      this.spawnParticles("red-dot", this.player.x, this.player.y - 18, 30, 0.85);
      this.cameras.main.shake(240, 0.008);
      audio.playSfx("wrong");
      if (this.run.lives <= 0) {
        this.emitHud(true);
        this.finishRun(false);
        return;
      }
    }

    this.emitHud(true);
  }

  completeLevel() {
    if (this.gameEnded || this.quizOpen) {
      return;
    }

    this.gameEnded = true;
    this.physics.pause();
    this.run.score += 220 + this.run.lives * 45 + Math.round(this.run.knowledge * 0.8);
    this.run.difficulty = clamp(this.run.difficulty + 0.2, 1, 4);
    const nextLevel = this.levelIndex + 1;

    this.spawnParticles("green-dot", this.portal.x, this.portal.y, 48, 1);
    audio.playSfx("correct");
    this.emitHud(true);

    this.time.delayedCall(650, () => {
      if (nextLevel < this.worldLevels.length) {
        this.cameras.main.fadeOut(360, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start("GameScene", {
            worldId: this.worldId,
            levelIndex: nextLevel,
            runState: { ...this.run, worldId: this.worldId }
          });
        });
      } else {
        this.finishRun(true);
      }
    });
  }

  finishRun(victory) {
    if (this.finished) {
      return;
    }

    this.finished = true;
    this.gameEnded = true;
    this.physics.pause();
    this.scene.stop("UIScene");
    this.cameras.main.fadeOut(360, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("GameOverScene", {
        victory,
        worldId: this.worldId,
        score: this.run.score,
        knowledge: this.run.knowledge,
        coins: this.run.coins,
        correct: this.run.correct,
        answered: this.run.answered
      });
    });
  }

  spawnParticles(key, x, y, count = 16, scale = 0.6) {
    const safeCount = Math.min(count, 28);
    const emitter = this.add.particles(0, 0, key, {
      speed: { min: 70, max: 260 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 260, max: 620 },
      gravityY: 600,
      scale: { start: scale, end: 0 },
      alpha: { start: 0.95, end: 0 },
      blendMode: Phaser.BlendModes.ADD,
      emitting: false
    });
    emitter.explode(safeCount, x, y);
    this.time.delayedCall(720, () => emitter.destroy());
  }

  emitHud(force = false, time = this.time.now) {
    if (!force && time - this.lastHudAt < 150) {
      return;
    }

    this.lastHudAt = time;
    this.run.progress = clamp((this.player.x - 100) / (this.level.length - 260), 0, 1);
    this.run.worldName = this.theme.name;
    this.run.levelName = this.level.name;
    this.run.speedActive = time < this.speedUntil;
    this.run.shieldActive = time < this.shieldUntil;
    this.game.events.emit("hud:update", { ...this.run });
  }
}
