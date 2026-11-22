const fs = require("fs");
const path = require("path");
const { drive, getStreamFromURL, getExtFromUrl, getTime } = global.utils;

function createWelcomeEvent() {
	try {
		const welcomePath = path.join(__dirname, "../events/welcome.js");
		const welcomeCode = `
const { drive, getStreamFromURL } = global.utils;
const DEFAULT_WELCOME_PIC = "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80";
module.exports = {
	config: { name: "welcome", version: "6.1", author: "ariYa'n", description: "Aesthetic welcome" },
	langs: { en: { defaultWelcome: "𓂃 ࣪˖ ִֶָ 𓂃 ࣪˖ ִֶָ 𓂃 ࣪˖ ִֶָ 𓂃\\n\\n      ⋆ ˚｡⋆୨୧˚ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ˚୨୧⋆｡˚ ⋆\\n\\n  𓂃 ࣪˖ ִֶָ 𓂃 ࣪˖ ִֶָ 𓂃 ࣪˖ ִֶָ 𓂃\\n\\n  hii {userNameTag} 𓇼 ⋆｡˚\\n  finally you are here ૮꒰˶• ༝ •˶꒱ა ♡\\n\\n  ⊹ ࣪ ˖ group : {boxName} ⊹\\n  ⊹ ࣪ ˖ time : {session} ⊹\\n  ⊹ ࣪ ˖ vibe : soft + pretty + aesthetic ⊹\\n\\n  ───── ୨୧ ─────\\n  🤍 stay kind, stay soft\\n  🌸 stay active, stay pretty\\n  🦋 make lots of memories here\\n  ───── ୨୧ ─────\\n\\n  welcome {multiple} to our little world ✨\\n  hope {multiple} have a beautiful {session} here 𓍯\\n\\n  𓂃 ࣪˖ ִֶָ 𓂃 ࣪˖ ִֶָ 𓂃 ࣪˖ ִֶָ 𓂃\\n       — 𝐚𝐫𝐢𝐘𝐚'𝐧 𝐁𝐎𝐓 ✦ —" } },
	onStart: async function ({ threadsData, message, event, api, getLang }) {
		try {
			if (event.logMessageType !== "log:subscribe") return;
			const { threadID } = event;
			const { data, settings } = await threadsData.get(threadID);
			if (settings.sendWelcomeMessage === false) return;
			const { addedParticipants } = event.logMessageData;
			if (!addedParticipants) return;
			const threadInfo = await api.getThreadInfo(threadID);
			const h = new Date().getHours();
			let session = "day";
			if (h >= 5 && h < 12) session = "morning ☀️🌸";
			else if (h >= 12 && h < 17) session = "afternoon 🌤️🤍";
			else if (h >= 17 && h < 21) session = "evening 🌇🦋";
			else session = "night 🌙✨";
			for (const user of addedParticipants) {
				if (user.userFbId == api.getCurrentUserID()) continue;
				let msg = data.welcomeMessage || getLang("defaultWelcome");
				msg = msg.replace(/\\{userNameTag\\}/g, "@" + user.fullName).replace(/\\{userName\\}/g, user.fullName).replace(/\\{boxName\\}/g, threadInfo.threadName || "this group").replace(/\\{multiple\\}/g, addedParticipants.length > 1 ? "you guys" : "you").replace(/\\{session\\}/g, session);
				let attachments = [];
				if (data.welcomeAttachment && data.welcomeAttachment.length > 0) {
					for (const id of data.welcomeAttachment) { try { attachments.push(await drive.getFile(id, "stream")); } catch (e) {} }
				} else { try { attachments.push(await getStreamFromURL(DEFAULT_WELCOME_PIC)); } catch (e) {} }
				await message.send({ body: msg, attachment: attachments, mentions: [{ tag: "@" + user.fullName, id: user.userFbId }] });
			}
		} catch (e) { console.log("WELCOME ERROR:", e); }
	}
};
`;
		fs.writeFileSync(welcomePath, welcomeCode);
		console.log("✅ setwelcome: welcome.js force create done");
		return true;
	} catch (e) { console.log("CREATE ERROR:", e); return false; }
}
createWelcomeEvent();

module.exports = {
	config: {
		name: "setwelcome",
		aliases: ["setwc"],
		version: "6.1",
		author: "ariYa'n",
		countDown: 5,
		role: 0,
		description: { en: "Aesthetic welcome 2 in 1" },
		category: "custom",
		guide: { en: { body: "{pn} on | {pn} off | {pn} text <msg> | {pn} text reset | {pn} file" } }
	},
	langs: {
		en: {
			turnedOn: "✨ Aesthetic Welcome ON hoye gese 🤍\nWelcome event o banano hoise. Ebar bot 1 bar restart de.",
			turnedOff: "Aesthetic Welcome OFF hoye gese",
			missingContent: "Msg ta dao age",
			edited: "Welcome msg change hoye gese:\n\n%1",
			reseted: "Reset hoye gese, ekhon aesthetic default cholbe",
			noFile: "Delete korar moto kono file nai",
			resetedFile: "File delete hoye gese",
			missingFile: "Pic/video reply diye dao",
			addedFile: "✨ %1 ta file add hoye gese"
		}
	},
	onStart: async function ({ args, threadsData, message, event, commandName, getLang }) {
		const { threadID, senderID, body } = event;
		const { data, settings } = await threadsData.get(threadID);
		if (!args[0]) return message.reply("Use: !setwelcome on / off / text <msg>");
		switch (args[0]) {
			case "text": {
				if (!args[1]) return message.reply(getLang("missingContent"));
				else if (args[1] == "reset") delete data.welcomeMessage;
				else data.welcomeMessage = body.slice(body.indexOf(args[0]) + args[0].length).trim();
				await threadsData.set(threadID, { data });
				message.reply(data.welcomeMessage ? getLang("edited", data.welcomeMessage) : getLang("reseted"));
				break;
			}
			case "file": {
				if (args[1] == "reset") {
					if (!data.welcomeAttachment) return message.reply(getLang("noFile"));
					try { await Promise.all(data.welcomeAttachment.map(id => drive.deleteFile(id))); delete data.welcomeAttachment; } catch (e) {}
					await threadsData.set(threadID, { data });
					message.reply(getLang("resetedFile"));
				} else if (event.attachments.length == 0 && (!event.messageReply || event.messageReply.attachments.length == 0))
					return message.reply(getLang("missingFile"), (err, info) => {
						global.GoatBot.onReply.set(info.messageID, { messageID: info.messageID, author: senderID, commandName });
					});
				else saveChanges(message, event, threadID, senderID, threadsData, getLang);
				break;
			}
			case "on": case "off": {
				createWelcomeEvent();
				settings.sendWelcomeMessage = args[0] == "on";
				await threadsData.set(threadID, { settings });
				message.reply(settings.sendWelcomeMessage ? getLang("turnedOn") : getLang("turnedOff"));
				break;
			}
			default: message.reply("Use: !setwelcome on / off / text <msg>"); break;
		}
	},
	onReply: async function ({ event, Reply, message, threadsData, getLang }) {
		const { threadID, senderID } = event;
		if (senderID != Reply.author) return;
		if (event.attachments.length == 0 && (!event.messageReply || event.messageReply.attachments.length == 0)) return message.reply(getLang("missingFile"));
		saveChanges(message, event, threadID, senderID, threadsData, getLang);
	}
};

async function saveChanges(message, event, threadID, senderID, threadsData, getLang) {
	const { data } = await threadsData.get(threadID);
	const attachments = [...event.attachments, ...(event.messageReply?.attachments || [])].filter(i => ["photo", "png", "animated_image", "video", "audio"].includes(i.type));
	if (!data.welcomeAttachment) data.welcomeAttachment = [];
	await Promise.all(attachments.map(async a => {
		const ext = getExtFromUrl(a.url);
		const info = await drive.uploadFile(`setwelcome_${threadID}_${senderID}_${getTime()}.${ext}`, await getStreamFromURL(a.url));
		data.welcomeAttachment.push(info.id);
	}));
	await threadsData.set(threadID, { data });
	message.reply(getLang("addedFile", attachments.length));
}
