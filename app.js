// app.js
let startY = null;
let startX = null;
let longPressTimeout;
let currentVolume = 50;

const background = document.getElementById("background");
const cover = document.getElementById("cover");
const title = document.getElementById("title");
const artist = document.getElementById("artist");
const album = document.getElementById("album");
const settingsPanel = document.getElementById("settings-panel");

document.addEventListener("touchstart", (e) => {
  startY = e.touches[0].clientY;
  startX = e.touches[0].clientX;

  longPressTimeout = setTimeout(() => {
    settingsPanel.classList.add("visible");
  }, 800);
});

document.addEventListener("touchend", (e) => {
  clearTimeout(longPressTimeout);
  const deltaX = e.changedTouches[0].clientX - startX;
  const deltaY = e.changedTouches[0].clientY - startY;

  if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < 0) skipTrack("next");
    else skipTrack("previous");
  } else if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
    adjustVolume(deltaY);
  }
});

function skipTrack(direction) {
  const token = localStorage.getItem("access_token");
  fetch(`https://api.spotify.com/v1/me/player/${direction}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

function adjustVolume(deltaY) {
  const token = localStorage.getItem("access_token");
  currentVolume = Math.max(0, Math.min(100, currentVolume - deltaY / 2));
  fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${currentVolume}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function fetchTrack() {
  const token = localStorage.getItem("access_token");
  const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204) return;
  const data = await res.json();

  title.textContent = data.item.name;
  artist.textContent = data.item.artists.map(a => a.name).join(", ");
  album.textContent = data.item.album.name;

  const imgUrl = document.querySelector("input[name='image-type']:checked").value === "cover"
    ? data.item.album.images[0].url
    : data.item.artists[0].images?.[0]?.url || data.item.album.images[0].url;

  cover.src = imgUrl;
  updateBackgroundFromImage(imgUrl);
}

function updateBackgroundFromImage(url) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1;
    canvas.height = 1;
    ctx.drawImage(img, 0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    background.style.background = `linear-gradient(to bottom right, rgb(${r},${g},${b}), black)`;
    document.body.style.color = (r + g + b) / 3 < 128 ? "white" : "black";
  };
}

setInterval(fetchTrack, 3000);
