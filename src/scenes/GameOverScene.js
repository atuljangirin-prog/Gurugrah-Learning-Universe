import { DEFAULT_RUN, GAME_HEIGHT, GAME_WIDTH, WORLD_THEMES } from "../utils/constants.js";
import { getBestScore, saveLeaderboardEntry } from "../utils/storage.js";
import { addGlassPanel, addPremiumButton, addSceneBackground, createTitle, transitionTo } from "../utils/ui.js";

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  init(data) {
    this.result = {
      victory: Boolean(data?.victory),
      worldId: data?.worldId || "math",
      score: data?.score || 0,
      knowledge: data?.knowledge || 0,
      coins: data?.coins || 0,
      correct: data?.correct || 0,
      answered: data?.answered || 0
    };
  }

  create() {
    const theme = WORLD_THEMES[this.result.worldId] || WORLD_THEMES.math;
    addSceneBackground(this, theme);
    this.cameras.main.fadeIn(320, 0, 0, 0);

    saveLeaderboardEntry({
      name: "Learner",
      world: theme.short,
      score: this.result.score,
      knowledge: this.result.knowledge,
      victory: this.result.victory
    });

    createTitle(this, GAME_WIDTH / 2, 114, this.result.victory ? "World Complete" : "Game Over", 58);
    const panel = addGlassPanel(this, GAME_WIDTH / 2, 382, 650, 430, { alpha: 0.12, shadowAlpha: 0.38 });
    const best = getBestScore();
    const accuracy = this.result.answered ? Math.round((this.result.correct / this.result.answered) * 100) : 0;
    const rows = [
      ["Score", this.result.score],
      ["Best", best],
      ["Knowledge Points", this.result.knowledge],
      ["Coins", this.result.coins],
      ["Quiz Accuracy", `${accuracy}%`]
    ];

    rows.forEach(([label, value], index) => {
      const y = -150 + index * 54;
      const labelText = this.add.text(-230, y, label, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "19px",
        fontStyle: "800",
        color: "rgba(255,255,255,0.68)"
      }).setOrigin(0, 0.5);
      const valueText = this.add.text(230, y, `${value}`, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "24px",
        fontStyle: "900",
        color: "#ffffff"
      }).setOrigin(1, 0.5);
      panel.add([labelText, valueText]);
    });

    addPremiumButton(this, GAME_WIDTH / 2 - 174, 594, 290, 64, "Restart", () => {
      transitionTo(this, "GameScene", {
        worldId: this.result.worldId,
        levelIndex: 0,
        runState: { ...DEFAULT_RUN, worldId: this.result.worldId }
      });
    }, { variant: "warm", fontSize: 22 });

    addPremiumButton(this, GAME_WIDTH / 2 + 174, 594, 290, 64, "Menu", () => transitionTo(this, "MenuScene"), {
      variant: "cool",
      fontSize: 22
    });

    addPremiumButton(this, GAME_WIDTH / 2, 668, 260, 52, "Leaderboard", () => transitionTo(this, "LeaderboardScene"), {
      variant: "ghost",
      fontSize: 18
    });
  }
}
