const { drive } = global.utils;

module.exports = {
	config: {
		name: "welcome",
		version: "2.0",
		author: "ariYa'n",
		description: "Aesthetic welcome"
	},
	langs: {
		en: {
			defaultWelcome: "╭─── ✦ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ✦ ───╮\n│\n│  🕊️ Hey {userNameTag} ✨\n│\n│  Welcome to — {boxName} 💌\n│  Hope {multiple} have a beautiful {session} here 🌸\n│\n│  ━━━━━━━━━━━━━━━\n│  🤍 Stay kind, stay active\n│  ✨ Enjoy your time with us\n│\n╰─── ✦ 𝐚𝐫𝐢𝐘𝐚'𝐧 𝐁𝐎𝐓 ✦ ───╯"
		}
	},
	onStart: async function ({ threadsData, message, event, api, getLang }) {
		if (event.logMessageType !== "log:subscribe") return;
		const { threadID } = event;
		const { data, settings } = await threadsData.get(threadID);
		if (settings.sendWelcomeMessage == false) return;

		const { addedParticipants } = event.logMessageData;
		const threadInfo = await api.getThreadInfo(threadID);

		const h = new Date().getHours();
		let session = "day";
		if (h >= 5 && h < 12) session = "morning ☀️";
		else if (h >= 12 && h < 17) session = "afternoon 🌤️";
		else if (h >= 17 && h < 21) session = "evening 🌇";
		else session = "night 🌙";

		for (const user of addedParticipants) {
			if (user.userFbId == api.getCurrentUserID()) continue;
			let msg = data.welcomeMessage || getLang("defaultWelcome");
			msg = msg.replace(/\{userNameTag\}/g, `@${user.fullName}`)
				.replace(/\{userName\}/g, user.fullName)
				.replace(/\{boxName\}/g, threadInfo.threadName || "this group")
				.replace(/\{multiple\}/g, addedParticipants.length > 1 ? "you guys" : "you")
				.replace(/\{session\}/g, session);

			let attachments = [];
			if (data.welcomeAttachment?.length > 0) {
				for (const id of data.welcomeAttachment) {
					try { attachments.push(await drive.getFile(id, "stream")); } catch (e) {}
				}
			}
			message.send({
				body: msg,
				attachment: attachments,
				mentions: [{ tag: `@${user.fullName}`, id: user.userFbId }]
			});
		}
	}
};
