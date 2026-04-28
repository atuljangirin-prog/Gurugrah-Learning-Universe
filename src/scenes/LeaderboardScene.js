import { GAME_WIDTH, WORLD_THEMES } from "../utils/constants.js";
import { getLeaderboard } from "../utils/storage.js";
import { addGlassPanel, addPremiumButton, addSceneBackground, createTitle, transitionTo } from "../utils/ui.js";

export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super("LeaderboardScene");
  }

  create() {
    addSceneBackground(this, WORLD_THEMES.quiz);
    this.cameras.main.fadeIn(320, 0, 0, 0);
    createTitle(this, GAME_WIDTH / 2, 82, "Leaderboard", 54);

    const panel = addGlassPanel(this, GAME_WIDTH / 2, 362, 890, 472, { alpha: 0.12, shadowAlpha: 0.34 });
    const headerStyle = {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "15px",
      fontStyle: "900",
      color: "rgba(255,255,255,0.56)"
    };
    const headers = [
      ["Rank", -376],
      ["World", -234],
      ["Score", -40],
      ["KP", 150],
      ["Result", 314]
    ];

    headers.forEach(([text, x]) => {
      panel.add(this.add.text(x, -204, text, headerStyle).setOrigin(0, 0.5));
    });

    const entries = getLeaderboard();
    if (!entries.length) {
      panel.add(this.add.text(0, 0, "No scores yet. Start an adventure to claim the first spot.", {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "22px",
        fontStyle: "800",
        color: "rgba(255,255,255,0.74)",
        align: "center",
        wordWrap: { width: 620, useAdvancedWrap: true }
      }).setOrigin(0.5));
    }

    entries.forEach((entry, index) => {
      const y = -158 + index * 40;
      const stripe = this.add.rectangle(0, y, 806, 32, index % 2 ? 0xffffff : 0x3edaff, index % 2 ? 0.045 : 0.065);
      const rank = this.add.text(-376, y, `${index + 1}`, this.rowStyle(true)).setOrigin(0, 0.5);
      const world = this.add.text(-234, y, entry.world || "World", this.rowStyle(false)).setOrigin(0, 0.5);
      const score = this.add.text(46, y, `${entry.score}`, this.rowStyle(true)).setOrigin(1, 0.5);
      const kp = this.add.text(184, y, `${entry.knowledge || 0}`, this.rowStyle(false)).setOrigin(1, 0.5);
      const result = this.add.text(314, y, entry.victory ? "Complete" : "Attempt", this.rowStyle(false)).setOrigin(0, 0.5);
      panel.add([stripe, rank, world, score, kp, result]);
    });

    addPremiumButton(this, GAME_WIDTH / 2 - 150, 650, 260, 58, "Menu", () => transitionTo(this, "MenuScene"), {
      variant: "cool",
      fontSize: 20
    });
    addPremiumButton(this, GAME_WIDTH / 2 + 150, 650, 260, 58, "Play", () => transitionTo(this, "WorldScene"), {
      variant: "warm",
      fontSize: 20
    });
  }

  rowStyle(strong) {
    return {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: strong ? "19px" : "17px",
      fontStyle: strong ? "900" : "800",
      color: "#ffffff"
    };
  }
}
