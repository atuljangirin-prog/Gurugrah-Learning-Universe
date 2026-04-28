export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const STORAGE_KEYS = {
  leaderboard: "gurugrah.leaderboard.v1",
  settings: "gurugrah.settings.v1"
};

export const DEFAULT_SETTINGS = {
  musicVolume: 0.36,
  sfxEnabled: true
};

export const DEFAULT_RUN = {
  lives: 3,
  score: 0,
  knowledge: 0,
  coins: 0,
  correct: 0,
  answered: 0,
  difficulty: 1,
  power: "none"
};

export const WORLD_THEMES = {
  math: {
    id: "math",
    name: "Math World",
    short: "Math",
    accent: 0xff9b35,
    secondary: 0xff3f8f,
    dark: 0x080b1d
  },
  science: {
    id: "science",
    name: "Science World",
    short: "Science",
    accent: 0x24e08a,
    secondary: 0x3edaff,
    dark: 0x07151d
  },
  coding: {
    id: "coding",
    name: "Coding World",
    short: "Coding",
    accent: 0x8f7cff,
    secondary: 0x38d8ff,
    dark: 0x0a0a1f
  },
  quiz: {
    id: "quiz",
    name: "Quiz Arena",
    short: "Quiz",
    accent: 0xffd166,
    secondary: 0x42f5b9,
    dark: 0x11101d
  }
};
