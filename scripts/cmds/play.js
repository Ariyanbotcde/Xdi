const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");
const { execFile } = require("child_process");
const ytSearch = require("yt-search");

// ================= SETTINGS =================
const API_URL = "https://youtube-api-qfde.onrender.com";
const DOWNLOADER_APIS = [
  "https://nayan-video-downloader.vercel.app/alldown?url={url}",
  "https://noobs-api.top/dipto/alldl?url={url}"
];
const MAX_DURATION = 10 * 60;
const HARD_LIMIT_MB = 500;
const CACHE_DIR = path.join(__dirname, "cache");
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36";
const TIMEOUT_MS = 90000;
const LONG_TIMEOUT_MS = 600000;

// ================= COMMON =================
function react(api, id, emoji) {
  return new Promise(resolve => api.setMessageReaction(emoji, id, () => resolve(), true));
}
function send(api, message, event) {
  return new Promise((resolve, reject) => api.sendMessage(message, event.threadID, err => err ? reject(err) : resolve(), event.messageID));
}
function formatFileSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
function sendAudio(api, event, title, filePath) {
  return new Promise(async (resolve, reject) => {
    try {
      const stat = await fs.stat(filePath);
      const size = formatFileSize(stat.size);
      const stream = fs.createReadStream(filePath);
      stream.once("error", reject);
      api.sendMessage(
        {
          body: `🎵 𝗦𝗢𝗡𝗚:\n${title || "Unknown"}\n\n📦 𝗦𝗜𝗭𝗘: ${size}`,
          attachment: stream
        },
        event.threadID,
        err => err ? reject(err) : resolve(),
        event.messageID
      );
    } catch (error) {
      reject(error);
    }
  });
}

// ================= SEARCH =================
async function searchSong(query) {
  let result = await ytSearch(`${query} song`);
  if (result.videos && result.videos.length) {
    return result.videos[0];
  }
  result = await ytSearch(query);
  return result.videos && result.videos.length ? result.videos[0] : null;
}

// ================= FFMPEG =================
let _ffmpegPath;
async function getFfmpeg() {
  if (_ffmpegPath !== undefined) return _ffmpegPath;
  const candidates = [];
  try { candidates.push(require("ffmpeg-static")); } catch (_) {}
  try { candidates.push(require("@ffmpeg-installer/ffmpeg").path); } catch (_) {}
  candidates.push("ffmpeg");
  for (const candidate of candidates) {
    if (!candidate) continue;
    const available = await new Promise(resolve => {
      execFile(candidate, ["-version"], { timeout: 10000 }, error => resolve(!error));
    });
    if (available) {
      return (_ffmpegPath = candidate);
    }
  }
  return (_ffmpegPath = null);
}
function runFfmpeg(bin, args) {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { timeout: LONG_TIMEOUT_MS, maxBuffer: 1024 * 1024 * 20 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(String(stderr || error.message).trim().split("\n").slice(-3).join(" ").slice(0, 250)));
      }
      resolve();
    });
  });
}

// ================= AUDIO CONVERSION =================
async function convertToMp3(input, output) {
  const ffmpeg = await getFfmpeg();
  if (!ffmpeg) {
    throw new Error("FFmpeg পাওয়া যায়নি। ffmpeg-static install করতে হবে।");
  }
  await runFfmpeg(ffmpeg, ["-y", "-i", input, "-vn", "-map", "0:a:0", "-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", "-ac", "2", "-id3v2_version", "3", output]);
  const stat = await fs.stat(output);
  if (!stat.size) {
    throw new Error("MP3 conversion failed.");
  }
  return output;
}

// ================= EXISTING AUDIO API =================
async function downloadAudio(url, filePath) {
  const response = await fetch(`${API_URL}/api/audio?url=${encodeURIComponent(url)}`, {
    redirect: "follow",
    headers: { "User-Agent": BROWSER_UA },
    signal: AbortSignal.timeout(10 * 60 * 1000)
  });
  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => "");
    let message = `API HTTP ${response.status}`;
    try {
      const data = JSON.parse(body);
      message = data.error || data.message || message;
    } catch (_) {}
    throw new Error(message);
  }
  const type = response.headers.get("content-type") || "";
  if (/application\/json|text\/html|video\//i.test(type)) {
    throw new Error("Render API returned no audio file.");
  }
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(filePath));
  const stat = await fs.stat(filePath);
  if (!stat.size) {
    throw new Error("Downloaded audio is empty.");
  }
}

// ================= API URL EXTRACTOR =================
function findMedia(data, inputUrl) {
  const BAD = /thumb|cover|image|avatar|poster|preview|icon/i;
  const PRIORITY = ["hdplay", "hd", "high", "play", "video", "url", "download", "link", "result", "low", "sd"];
  const found = [];
  let title = "";
  (function walk(obj, key) {
    if (typeof obj === "string") {
      if (/^https?:\/\//i.test(obj)) {
        if (!BAD.test(key) && obj !== inputUrl && !/\.(jpe?g|png|webp|gif)(\?|$)/i.test(obj)) {
          found.push({ key: String(key).toLowerCase(), url: obj });
        }
      } else if (/^(title|caption|desc|description|name)$/i.test(key) && !title) {
        title = obj;
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(item => walk(item, key));
    } else if (obj && typeof obj === "object") {
      Object.keys(obj).forEach(k => walk(obj[k], k));
    }
  })(data, "");
  const rank = item => {
    const index = PRIORITY.indexOf(item.key);
    return index === -1 ? 99 : index;
  };
  found.sort((a, b) => rank(a) - rank(b));
  return { urls: [...new Set(found.map(item => item.url))], title };
}

// ================= VIDEO DOWNLOAD =================
async function saveVideo(videoUrl, filePath) {
  const response = await axios.get(videoUrl, {
    responseType: "stream",
    timeout: TIMEOUT_MS,
    maxRedirects: 10,
    headers: { "User-Agent": BROWSER_UA }
  });
  const type = response.headers["content-type"] || "";
  if (/application\/json|text\/html/i.test(type)) {
    response.data.destroy();
    throw new Error("Invalid media URL.");
  }
  const length = Number(response.headers["content-length"] || 0);
  if (length > HARD_LIMIT_MB * 1024 * 1024) {
    response.data.destroy();
    throw new Error("Video exceeds 500 MB.");
  }
  let received = 0;
  try {
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      response.data.on("data", chunk => {
        received += chunk.length;
        if (received > HARD_LIMIT_MB * 1024 * 1024) {
          response.data.destroy(new Error("Video exceeds 500 MB."));
        }
      });
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
      response.data.on("error", reject);
    });
  } catch (error) {
    await fs.remove(filePath).catch(() => {});
    throw error;
  }
  const stat = await fs.stat(filePath);
  if (!stat.size) {
    throw new Error("Downloaded video is empty.");
  }
}

// ================= EXTERNAL API FALLBACK =================
async function downloadExternalVideo(url, videoPath) {
  let lastError;
  for (const template of DOWNLOADER_APIS) {
    try {
      const endpoint = template.replace("{url}", encodeURIComponent(url));
      console.log("[SING API] Trying:", endpoint);
      const { data } = await axios.get(endpoint, {
        timeout: 30000,
        headers: { "User-Agent": BROWSER_UA }
      });
      const media = findMedia(data, url);
      if (!media.urls.length) {
        throw new Error("API response এ media URL নেই।");
      }
      for (const mediaUrl of media.urls.slice(0, 4)) {
        try {
          await saveVideo(mediaUrl, videoPath);
          return { title: media.title, mediaUrl };
        } catch (error) {
          lastError = error;
          await fs.remove(videoPath).catch(() => {});
        }
      }
    } catch (error) {
      lastError = error;
      console.error("[SING API FAILED]", error.message);
    }
  }
  throw lastError || new Error("All downloader APIs failed.");
}

// ================= MAIN DOWNLOAD =================
async function downloadSong(url, id, audioPath) {
  const videoPath = path.join(CACHE_DIR, `${id}_source.mp4`);
  try {
    try {
      await downloadAudio(url, audioPath);
      return;
    } catch (error) {
      console.error("[SING RENDER API FALLBACK]", error.message);
      await fs.remove(audioPath).catch(() => {});
    }
    await downloadExternalVideo(url, videoPath);
    await convertToMp3(videoPath, audioPath);
  } finally {
    await fs.remove(videoPath).catch(() => {});
  }
}

// ================= COMMAND =================
module.exports = {
  config: {
    name: "sing",
    aliases: ["song", "music", "audio"],
    version: "3.0.1",
    author: "ARIYA'N BB'Z DIBA",
    countDown: 15,
    role: 0,
    shortDescription: "Search and download songs as audio",
    longDescription: "Search YouTube and extract MP3 audio using multiple APIs and FFmpeg. Maximum duration is 10 minutes.",
    category: "media",
    guide: "{pn} <song name or singer name>"
  },
  onStart: async function ({ api, event, args }) {
    const query = args.join(" ").trim();
    if (!query) {
      return send(api, "❌ Song ba singer-er naam dao.\nExample: /sing Tere Bina", event);
    }
    if (/https?:\/\//i.test(query)) {
      return send(api, "❌ Song-er naam dao, YouTube link noy.", event);
    }
    const id = `sing_${Date.now()}_${process.pid}`;
    const filePath = path.join(CACHE_DIR, `${id}.mp3`);
    try {
      await react(api, event.messageID, "⏳");
      await fs.ensureDir(CACHE_DIR);
      await send(api, `🔍 Searching song: ${query}`, event);
      const video = await searchSong(query);
      if (!video || !video.url) {
        throw new Error("No matching song found.");
      }
      if (Number(video.seconds || 0) > MAX_DURATION) {
        throw new Error("First matching result is longer than 10 minutes.");
      }
      await send(api, `🎧 Preparing: ${video.title}`, event);
      await downloadSong(video.url, id, filePath);
      await sendAudio(api, event, video.title, filePath);
      await react(api, event.messageID, "✅");
    } catch (error) {
      console.error("[SING ERROR]", error.stack || error);
      await react(api, event.messageID, "❌").catch(() => {});
      await send(api, `❌ ${error.message || "Song download failed."}`, event).catch(() => {});
    } finally {
      await fs.remove(filePath).catch(() => {});
    }
  }
};
