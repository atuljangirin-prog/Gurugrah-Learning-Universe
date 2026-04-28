export function setupOrientationGuard() {
  const update = () => {
    const portrait = window.matchMedia("(orientation: portrait) and (max-width: 920px)").matches;
    document.body.dataset.orientation = portrait ? "portrait" : "landscape";
  };

  update();
  window.addEventListener("resize", update);
  window.addEventListener("orientationchange", update);
}

export async function lockLandscape() {
  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock("landscape");
    }
  } catch {
    // Most browsers only allow orientation locking after fullscreen starts.
  }
}

export async function toggleFullscreen() {
  const target = document.getElementById("game-shell") || document.documentElement;

  try {
    if (!document.fullscreenElement) {
      await target.requestFullscreen?.();
      await lockLandscape();
      return true;
    }

    await document.exitFullscreen?.();
    return false;
  } catch {
    return Boolean(document.fullscreenElement);
  }
}

export async function ensureLandscapeFullscreenOnMobile() {
  const target = document.getElementById("game-shell") || document.documentElement;
  const mobileLike = window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900;

  if (!mobileLike) {
    return false;
  }

  try {
    if (!document.fullscreenElement) {
      await target.requestFullscreen?.();
    }
    await lockLandscape();
    return true;
  } catch {
    return false;
  }
}
