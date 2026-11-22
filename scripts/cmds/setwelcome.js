
const { drive, getStreamFromURL, getExtFromUrl, getTime } = global.utils;

module.exports = {
	config: {
		name: "setwelcome",
		aliases: ["setwc"],
		version: "2.0",
		author: "ariYa'n bb'z",
		countDown: 5,
		role: 1,

		description: {
			en: "Customize aesthetic welcome messages for your group."
		},

		category: "custom",

		guide: {
			en: {
				body:
					"{pn} on - Enable welcome\n" +
					"{pn} off - Disable welcome\n" +
					"{pn} text <content> - Set welcome text\n" +
					"{pn} text reset - Reset welcome text\n" +
					"{pn} file - Add welcome attachment\n" +
					"{pn} file reset - Remove attachments\n\n" +
					"Available shortcuts:\n" +
					"• {userName} - Member name\n" +
					"• {userNameTag} - Member tag\n" +
					"• {boxName} - Group name\n" +
					"• {multiple} - Member/members\n" +
					"• {session} - Time of day\n\n" +
					"Reply with an image/video/audio to add welcome media."
			}
		}
	},

	langs: {
		en: {
			turnedOn: "╭━━━〔 ✨ WELCOME SYSTEM 〕━━━╮\n┃ 💗 Aesthetic Welcome: ON\n┃ 🌸 Your group is ready!\n╰━━━━━━━━━━━━━━━━━━━━╯",

			turnedOff: "╭━━━〔 🌙 WELCOME SYSTEM 〕━━━╮\n┃ 🥀 Aesthetic Welcome: OFF\n┃ ✨ Welcome system disabled.\n╰━━━━━━━━━━━━━━━━━━━━╯",

			missingContent: "❌ Please enter welcome message content!",

			edited: "╭━━━〔 💌 WELCOME UPDATED 〕━━━╮\n\n%1\n\n╰━━━━━━━━━━━━━━━━━━━━╯",

			reseted: "🌸 Welcome message reset successfully!",

			noFile: "❌ No welcome attachment found!",

			resetedFile: "🗑️ Welcome attachments removed successfully!",

			missingFile: "📎 Please reply to this message with an image/video/audio!",

			addedFile: "✨ Successfully added %1 welcome attachment(s)!"
		}
	},

	onStart: async function ({
		args,
		threadsData,
		message,
		event,
		commandName,
		getLang
	}) {
		const { threadID, senderID, body } = event;
		const { data, settings } = await threadsData.get(threadID);

		switch (args[0]) {

			case "text": {
				if (!args[1])
					return message.reply(getLang("missingContent"));

				if (args[1] === "reset") {
					delete data.welcomeMessage;
				}
				else {
					const index = body.toLowerCase().indexOf("text");
					data.welcomeMessage = body.slice(index + 4).trim();

					if (!data.welcomeMessage)
						return message.reply(getLang("missingContent"));
				}

				await threadsData.set(threadID, { data });

				return message.reply(
					data.welcomeMessage
						? getLang("edited", data.welcomeMessage)
						: getLang("reseted")
				);
			}

			case "file": {
				if (args[1] === "reset") {
					if (!data.welcomeAttachment?.length)
						return message.reply(getLang("noFile"));

					await Promise.all(
						data.welcomeAttachment.map(async fileId => {
							try {
								await drive.deleteFile(fileId);
							}
							catch (e) {}
						})
					);

					delete data.welcomeAttachment;

					await threadsData.set(threadID, { data });

					return message.reply(getLang("resetedFile"));
				}

				if (
					event.attachments.length === 0 &&
					(!event.messageReply ||
						event.messageReply.attachments.length === 0)
				) {
					return message.reply(getLang("missingFile"), (err, info) => {
						if (err || !info) return;

						global.GoatBot.onReply.set(info.messageID, {
							messageID: info.messageID,
							author: senderID,
							commandName
						});
					});
				}

				return saveChanges(
					message,
					event,
					threadID,
					senderID,
					threadsData,
					getLang
				);
			}

			case "on":
			case "off": {
				settings.sendWelcomeMessage = args[0] === "on";

				await threadsData.set(threadID, { settings });

				return message.reply(
					settings.sendWelcomeMessage
						? getLang("turnedOn")
						: getLang("turnedOff")
				);
			}

			default:
				return message.SyntaxError();
		}
	},

	onReply: async function ({
		event,
		Reply,
		message,
		threadsData,
		getLang
	}) {
		const { threadID, senderID } = event;

		if (senderID != Reply.author)
			return;

		if (
			event.attachments.length === 0 &&
			(!event.messageReply ||
				event.messageReply.attachments.length === 0)
		)
			return message.reply(getLang("missingFile"));

		return saveChanges(
			message,
			event,
			threadID,
			senderID,
			threadsData,
			getLang
		);
	}
};

async function saveChanges(
	message,
	event,
	threadID,
	senderID,
	threadsData,
	getLang
) {
	const { data } = await threadsData.get(threadID);

	const attachments = [
		...event.attachments,
		...(event.messageReply?.attachments || [])
	].filter(item =>
		["photo", "png", "animated_image", "video", "audio"].includes(item.type)
	);

	if (!attachments.length)
		return message.reply(getLang("missingFile"));

	if (!data.welcomeAttachment)
		data.welcomeAttachment = [];

	let uploaded = 0;

	try {
		for (const attachment of attachments) {
			const url = attachment.url;
			if (!url) continue;

			const ext = getExtFromUrl(url) || "bin";
			const fileName = `${getTime()}.${ext}`;

			const infoFile = await drive.uploadFile(
				`setwelcome_${threadID}_${senderID}_${fileName}`,
				await getStreamFromURL(url)
			);

			if (infoFile?.id) {
				data.welcomeAttachment.push(infoFile.id);
				uploaded++;
			}
		}

		await threadsData.set(threadID, { data });

		return message.reply(getLang("addedFile", uploaded));
	}
	catch (error) {
		console.error("SetWelcome Upload Error:", error);
		return message.reply("❌ Failed to upload welcome attachment!");
	}
				}
	
