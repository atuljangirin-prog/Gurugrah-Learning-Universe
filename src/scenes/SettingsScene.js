import { GAME_WIDTH, WORLD_THEMES } from "../utils/constants.js";
import { audio } from "../utils/audio.js";
import { toggleFullscreen } from "../utils/fullscreen.js";
import { loadSettings, saveSettings } from "../utils/storage.js";
import { addGlassPanel, addPremiumButton, addSceneBackground, createTitle, transitionTo } from "../utils/ui.js";

export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super("SettingsScene");
  }

  create() {
    this.settings = loadSettings();
    addSceneBackground(this, WORLD_THEMES.coding);
    this.cameras.main.fadeIn(320, 0, 0, 0);
    createTitle(this, GAME_WIDTH / 2, 92, "Settings", 54);

    const panel = addGlassPanel(this, GAME_WIDTH / 2, 362, 760, 430, { alpha: 0.12, shadowAlpha: 0.34 });
    this.addSettingLabel(panel, -300, -154, "Music Volume");
    this.slider = this.createSlider(panel, 0, -102, 600, this.settings.musicVolume, (value) => {
      this.settings.musicVolume = value;
      saveSettings(this.settings);
      audio.setMusicVolume(value);
    });

    this.addSettingLabel(panel, -300, 22, "Sound Effects");
    this.sfxButton = addPremiumButton(this, 178, 22, 250, 58, this.settings.sfxEnabled ? "SFX On" : "SFX Off", () => {
      this.settings.sfxEnabled = !this.settings.sfxEnabled;
      saveSettings(this.settings);
      audio.setSfxEnabled(this.settings.sfxEnabled);
      this.sfxButton.label.setText(this.settings.sfxEnabled ? "SFX On" : "SFX Off");
    }, { variant: "ghost", fontSize: 20 });
    panel.add(this.sfxButton);

    this.addSettingLabel(panel, -300, 126, "Fullscreen");
    const fullscreenButton = addPremiumButton(this, 178, 126, 250, 58, "Toggle", () => toggleFullscreen(), {
      variant: "cool",
      fontSize: 20
    });
    panel.add(fullscreenButton);

    addPremiumButton(this, GAME_WIDTH / 2, 650, 280, 60, "Back", () => transitionTo(this, "MenuScene"), {
      variant: "warm",
      fontSize: 22
    });
  }

  addSettingLabel(panel, x, y, label) {
    const text = this.add.text(x, y, label, {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "22px",
      fontStyle: "900",
      color: "#ffffff"
    }).setOrigin(0, 0.5);
    panel.add(text);
  }

  createSlider(panel, x, y, width, value, onChange) {
    const container = this.add.container(x, y);
    const valueText = this.add.text(width / 2, -52, `${Math.round(value * 100)}%`, {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "20px",
      fontStyle: "900",
      color: "#3edaff"
    }).setOrigin(1, 0.5);
    const trackShadow = this.add.rectangle(0, 0, width + 10, 24, 0x000000, 0.22);
    const track = this.add.rectangle(0, 0, width, 18, 0xffffff, 0.13);
    const fill = this.add.rectangle(-width / 2, 0, width * value, 18, 0x3edaff, 0.95).setOrigin(0, 0.5);
    const shine = this.add.rectangle(-width / 2, -4, width * value, 4, 0xffffff, 0.22).setOrigin(0, 0.5);
    const knob = this.add.circle(-width / 2 + width * value, 0, 22, 0xffffff, 0.98);
    const glow = this.add.circle(knob.x, 0, 32, 0x3edaff, 0.2).setBlendMode(Phaser.BlendModes.ADD);
    const hit = this.add.rectangle(0, 0, width + 34, 64, 0xffffff, 0.001);
    track.setStrokeStyle(1, 0xffffff, 0.28);
    container.add([valueText, trackShadow, track, fill, shine, glow, knob, hit]);
    hit.setInteractive({ useHandCursor: true });

    const updateFromPointer = (pointer) => {
      const localX = clamp(pointer.x - (panel.x + container.x) + width / 2, 0, width);
      const next = localX / width;
      fill.width = width * next;
      shine.width = fill.width;
      knob.x = -width / 2 + width * next;
      glow.x = knob.x;
      valueText.setText(`${Math.round(next * 100)}%`);
      onChange(next);
    };

    hit.on("pointerdown", updateFromPointer);
    hit.on("pointermove", (pointer) => {
      if (pointer.isDown) {
        updateFromPointer(pointer);
      }
    });

    panel.add(container);
    return container;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
