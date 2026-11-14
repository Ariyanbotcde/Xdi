const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');

module.exports = {
  config: {
    name: "song",
    version: "4.0",
    author: "ARIYA'N BB'Z",
    countDown: 5,
    role: 0,
    category: "music",
    guide: "{pn} <gaan er naam>"
  },
  langs: {
    en: {
      noResult: "⭕ | No results for %1",
      choose: "Song Results:\n\n%1\nReply with a number to download.",
      success: "✅ | Downloaded: %1"
    }
  },
  onStart: async function ({ api, args, event, commandName, getLang }) {
    const { threadID, messageID, senderID } = event;
    const input = args.join(" ");
    if (!input) return api.sendMessage("Gaan er naam dao! Ex: song tum hi ho", threadID, messageID);

    try {
      api.setMessageReaction("⏳", messageID, () => {}, true);

      // DIRECT YOUTUBE SEARCH - Kono API nai
      const search = await yts(input);
      const results = search.videos.slice(0, 6);
      if (!results.length) return api.sendMessage(getLang("noResult", input), threadID, messageID);

      // Jodi 1 ta e match kore, direct download - list dekhabe na
      // List dekhte chaile niche 6 ta dekhabe
      let msg = "";
      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      const attachments = [];

      for (let i = 0; i < results.length; i++) {
        msg += `${i + 1}. ${results[i].title}\nTime: ${results[i].timestamp}\n\n`;
        try {
          const thumbPath = path.join(cacheDir, `thumb_${Date.now()}_${i}.jpg`);
          const axios = require("axios");
          const t = await axios.get(results[i].thumbnail, { responseType: 'arraybuffer', timeout: 8000 });
          fs.writeFileSync(thumbPath, Buffer.from(t.data));
          attachments.push(fs.createReadStream(thumbPath));
        } catch {}
      }

      return api.sendMessage({ body: getLang("choose", msg), attachment: attachments }, threadID, (err, info) => {
        attachments.forEach(s => { try { if (fs.existsSync(s.path)) fs.unlinkSync(s.path); } catch {} });
        global.GoatBot.onReply.set(info.messageID, { commandName, author: senderID, results, menuMessageID: info.messageID });
      }, messageID);

    } catch (e) {
      console.log(e);
      return api.sendMessage("Abar try koro!", threadID, messageID);
    }
  },
  onReply: async function ({ event, api, Reply, getLang }) {
    if (event.senderID !== Reply.author) return;
    const choice = parseInt(event.body);
    if (isNaN(choice) || choice <= 0 || choice > Reply.results.length) return api.unsendMessage(Reply.menuMessageID);
    const video = Reply.results[choice - 1];
    api.unsendMessage(Reply.menuMessageID);
    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    const cacheDir = path.join(__dirname, 'cache');
    const filePath = path.join(cacheDir, `song_${Date.now()}.mp3`);

    try {
      // DIRECT DOWNLOAD - ytdl-core
      await new Promise((resolve, reject) => {
        const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 });
        const ws = fs.createWriteStream(filePath);
        stream.pipe(ws);
        stream.on('error', reject);
        ws.on('finish', resolve);
        ws.on('error', reject);
      });

      api.sendMessage({
        body: getLang("success", video.title),
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

    } catch (e) {
      console.log("Download Error:", e.message);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      api.sendMessage("Download fail, abar try koro!", event.threadID, event.messageID);
    }
  }
};
