const videos = [
  document.getElementById("left"),
  document.getElementById("center"),
  document.getElementById("right"),
];

const audio = document.getElementById("audio");
const button = document.getElementById("playPause");
const timeline = document.getElementById("timeline");
const controls = document.getElementById("controls");

videos[0].src = "https://pub-1bf5454447af4507a832554561663dc4.r2.dev/EMPIRE_exp2.compressed.mp4";
videos[1].src = "https://pub-1bf5454447af4507a832554561663dc4.r2.dev/LABOR_exp2.compressed.mp4";
videos[2].src = "https://pub-1bf5454447af4507a832554561663dc4.r2.dev/DREAMS_exp2.compressed.mp4";

audio.src = "https://pub-1bf5454447af4507a832554561663dc4.r2.dev/Triptych_07.wav";

console.log("script loaded");

let hideTimer;
let isScrubbing = false;

function showControls() {
  controls.classList.add("visible");

  clearTimeout(hideTimer);

  hideTimer = setTimeout(() => {
    controls.classList.remove("visible");
  }, 2000);
}

document.addEventListener("mousemove", showControls);
document.addEventListener("touchstart", showControls);

controls.addEventListener("mouseenter", () => {
  clearTimeout(hideTimer);
  controls.classList.add("visible");
});

controls.addEventListener("mouseleave", () => {
  hideTimer = setTimeout(() => {
    controls.classList.remove("visible");
  }, 2000);
});

button.addEventListener("click", async () => {
  showControls();

  try {
    if (audio.paused) {
      videos.forEach(video => {
        video.currentTime = audio.currentTime;
      });

      await Promise.all(videos.map(video => video.play()));
      await audio.play();

      button.textContent = "⏸︎";
    } else {
      videos.forEach(video => video.pause());
      audio.pause();

      button.textContent = "▶";
    }
  } catch (err) {
    console.error("Playback failed:", err);
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