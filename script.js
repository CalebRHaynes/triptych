const videos = [
  document.getElementById("left"),
  document.getElementById("center"),
  document.getElementById("right"),
];

const audio = document.getElementById("audio");
const button = document.getElementById("playPause");
const timeline = document.getElementById("timeline");
const controls = document.getElementById("controls");
const topbar = document.getElementById("topbar");
const soloButtons = document.querySelectorAll(".soloBtn");

videos[0].src = "https://pub-1bf5454447af4507a832554561663dc4.r2.dev/EMPIRE_exp2.compressed_crf28.mp4";
videos[1].src = "https://pub-1bf5454447af4507a832554561663dc4.r2.dev/LABOR_exp2.compressed_crf28.mp4";
videos[2].src = "https://pub-1bf5454447af4507a832554561663dc4.r2.dev/DREAMS_exp2.compressed_crf28.mp4";

videos.forEach(video => {
  video.preload = "auto";
});

audio.src = "https://pub-1bf5454447af4507a832554561663dc4.r2.dev/Triptych_07.wav";
audio.loop = true;

console.log("script loaded");

let hideTimer;
let isScrubbing = false;
let wakeLock = null;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
  } catch (err) {
    console.error("Wake lock failed:", err);
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

document.addEventListener("visibilitychange", async () => {
  if (wakeLock !== null && document.visibilityState === "visible" && !audio.paused) {
    await requestWakeLock();
  }
});

function showControls() {
  controls.classList.add("visible");
  topbar.classList.add("visible");

  clearTimeout(hideTimer);

  hideTimer = setTimeout(() => {
    controls.classList.remove("visible");
    topbar.classList.remove("visible");
  }, 2000);
}

// Show controls immediately on load
showControls();

document.addEventListener("mousemove", showControls);
document.addEventListener("touchstart", showControls);

controls.addEventListener("mouseenter", () => {
  clearTimeout(hideTimer);
  controls.classList.add("visible");
  topbar.classList.add("visible");
});

controls.addEventListener("mouseleave", () => {
  hideTimer = setTimeout(() => {
    controls.classList.remove("visible");
    topbar.classList.remove("visible");
  }, 2000);
});

topbar.addEventListener("mouseenter", () => {
  clearTimeout(hideTimer);
  controls.classList.add("visible");
  topbar.classList.add("visible");
});

topbar.addEventListener("mouseleave", () => {
  hideTimer = setTimeout(() => {
    controls.classList.remove("visible");
    topbar.classList.remove("visible");
  }, 2000);
});

// Solo bar logic
const soloMap = { left: 0, center: 1, right: 2 };

function setSolo(target) {
  soloButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.solo === target);
  });

  if (target === "all") {
    videos.forEach(video => video.classList.remove("solo-hidden"));
    return;
  }

  const soloIndex = soloMap[target];
  videos.forEach((video, i) => {
    video.classList.toggle("solo-hidden", i !== soloIndex);
  });
}

soloButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    setSolo(btn.dataset.solo);
    showControls();
  });
});

async function togglePlayback() {
  showControls();

  try {
    if (audio.paused) {
      videos.forEach(video => {
        video.currentTime = audio.currentTime;
      });

      const results = await Promise.allSettled(videos.map(video => video.play()));

      results.forEach((result, i) => {
        if (result.status === "rejected") {
          console.error(`Video ${i} failed to play:`, result.reason);
        }
      });

      await audio.play();
      await requestWakeLock();

      button.textContent = "⏸︎";
    } else {
      videos.forEach(video => video.pause());
      audio.pause();
      releaseWakeLock();

      button.textContent = "▶";
    }
  } catch (err) {
    console.error("Playback failed:", err);
  }
}

button.addEventListener("click", togglePlayback);

// Spacebar play/pause
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    const tag = document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;

    e.preventDefault();
    togglePlayback();
  }
});

setInterval(() => {
  if (isScrubbing) return;

  videos.forEach(video => {
    if (Math.abs(video.currentTime - audio.currentTime) > 0.1) {
      video.currentTime = audio.currentTime;
    }
  });
}, 100);

// Loop videos back to sync whenever audio loops
audio.addEventListener("seeked", () => {
  if (audio.currentTime === 0) {
    videos.forEach(video => {
      video.currentTime = 0;
    });
  }
});

audio.addEventListener("loadedmetadata", () => {
  timeline.max = audio.duration;
  timeline.value = 0;
});

audio.addEventListener("timeupdate", () => {
  if (!isScrubbing) {
    timeline.value = audio.currentTime;
  }
});

timeline.addEventListener("pointerdown", () => {
  isScrubbing = true;
});

timeline.addEventListener("input", () => {
  const time = Number(timeline.value);

  audio.currentTime = time;

  videos.forEach(video => {
    video.currentTime = time;
  });

  showControls();
});

timeline.addEventListener("change", () => {
  isScrubbing = false;

  const time = Number(timeline.value);

  audio.currentTime = time;

  videos.forEach(video => {
    video.currentTime = time;
  });
});