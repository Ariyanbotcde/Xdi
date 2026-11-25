const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "welcome",
    version: "2.1",
    author: "AriYa'n BB'Z",
    description: "Dynamic welcome - any group name + logo works"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;
    const { threadID, logMessageData } = event;
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    try {
      const added = logMessageData.addedParticipants || [];
      if (!added.length) return;

      // DYNAMIC - jekono group er info nibe
      const threadInfo = await api.getThreadInfo(threadID);
      const groupName = threadInfo.threadName || "Our Group";
      const groupLogoUrl = threadInfo.imageSrc || null;

      for (const user of added) {
        const newID = user.userFbId;
        const adderID = logMessageData.author;

        const info = await api.getUserInfo([newID, adderID]);
        const newUser = info[newID];
        const adderUser = info[adderID] || { name: "Someone" };

        const getAvatar = async (uid) => {
          const p = path.join(cacheDir, `av_${uid}_${Date.now()}.png`);
          try {
            const res = await axios.get(`https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" });
            fs.writeFileSync(p, Buffer.from(res.data));
            return p;
          } catch {
            const res2 = await axios.get(`https://i.imgur.com/2qWvQ2U.png`, { responseType: "arraybuffer" });
            fs.writeFileSync(p, Buffer.from(res2.data));
            return p;
          }
        };

        const newAvPath = await getAvatar(newID);
        const adderAvPath = await getAvatar(adderID);
        const groupLogoPath = path.join(cacheDir, `grp_${threadID}.png`);
        if (groupLogoUrl) {
          try {
            const g = await axios.get(groupLogoUrl, { responseType: "arraybuffer" });
            fs.writeFileSync(groupLogoPath, Buffer.from(g.data));
          } catch {}
        }

        const W = 1200, H = 700;
        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext("2d");

        const grad = ctx.createLinearGradient(0, 0, 1200, 700);
        grad.addColorStop(0, "#1a002e");
        grad.addColorStop(0.5, "#ff2e9a");
        grad.addColorStop(1, "#1a002e");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#ff6ec7";
        ctx.beginPath(); ctx.arc(150, 150, 180, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#7b2ff7";
        ctx.beginPath(); ctx.arc(1050, 550, 200, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px Arial";
        ctx.textAlign = "center";
        ctx.fillText("✦ WELCOME TO ✦", W / 2, 70);
        ctx.font = "bold 42px Arial";
        ctx.fillStyle = "#ffd6f5";
        // DYNAMIC GROUP NAME - ekhane ar stupid squad nai
        ctx.fillText(groupName.toUpperCase().slice(0, 28), W / 2, 115);

        async function drawCircle(imgPath, x, y, r, borderColor) {
          try {
            const img = await loadImage(imgPath);
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r + 8, 0, Math.PI * 2);
            ctx.fillStyle = borderColor;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
            ctx.restore();
          } catch {}
        }

        await drawCircle(newAvPath, 250, 350, 125, "#ffffff");
        if (fs.existsSync(groupLogoPath)) {
          await drawCircle(groupLogoPath, 600, 350, 100, "#ff2e9a");
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.font = "100px Arial";
          ctx.fillText("👑", 600, 380);
        }
        await drawCircle(adderAvPath, 950, 350, 125, "#ffffff");

        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.moveTo(375, 350); ctx.lineTo(500, 350); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(700, 350); ctx.lineTo(825, 350); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = "60px Arial";
        ctx.fillText("💖", 600, 265);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 28px Arial";
        ctx.fillText(newUser?.name?.slice(0, 18) || "New Member", 250, 520);
        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#ffd6f5";
        ctx.fillText("NEW MEMBER", 250, 545);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 28px Arial";
        ctx.fillText(adderUser?.name?.slice(0, 18) || "Adder", 950, 520);
        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#ffd6f5";
        ctx.fillText("ADDED BY", 950, 545);

        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(100, 575, 1000, 85);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 30px Arial";
        ctx.fillText(`Added by ${adderUser?.name}`, W / 2, 610);
        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#ff9ad5";
        // DYNAMIC - ekhane sudhu Power by thakbe, group name upore dynamic
        ctx.fillText(`Power by AriYa'n BB'Z`, W / 2, 640);

        const outPath = path.join(cacheDir, `welcome_${newID}_${Date.now()}.png`);
        fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

        // DYNAMIC MESSAGE - jekono group er naam bosbe
        const msg = `╭───✦ 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 ✦───╮\n│\n│  𝗛𝗲𝘆 ${newUser?.name} 🦋\n│  Welcome to ${groupName} 💖\n│\n│  ✨ Added by: ${adderUser?.name}\n│  🫶 Enjoy Adda, No Bad Vibes\n│\n╰───✦ ${groupName.toUpperCase()} ✦───╯\n\nPower by AriYa'n BB'Z`;

        api.sendMessage({ body: msg, attachment: fs.createReadStream(outPath) }, threadID, () => {
          [newAvPath, adderAvPath, groupLogoPath, outPath].forEach(f => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} });
        });
      }
    } catch (e) {
      console.log("WELCOME ERROR:", e.message);
    }
  }
};
