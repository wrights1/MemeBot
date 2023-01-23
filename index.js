const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: './KEYS.env' })
const lib = require('./lib');

// Create a new client instance
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	]
});

//gather Command handlers----------------------------------------------------------------------------------
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

//gather Event listeners----------------------------------------------------------------------------------
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}


// Log in to Discord with your client's token
client.login(process.env.TOKEN);

client.on('messageCreate', async message => {
	if (message.content.toLowerCase().startsWith('!deepfry')) {
		let sourceImageURL;
		if (message.reference) {
			message.fetchReference().then(function(replyMessage) {
				console.log('reply url get');
				sourceImageURL = replyMessage.attachments.size > 0 ? replyMessage.attachments.first()?.url : null;
				deepFryAndReply(message, sourceImageURL);				
			});
		} else if (message.attachments.size > 0) {
			//not a reply but contains an image so like upload your own image and say !deepfry
			sourceImageURL = message.attachments.size > 0 ? message.attachments.first()?.url : null
			deepFryAndReply(message, sourceImageURL);
		} else {
			message.reply('Gotta use this in reply to an image message');
		}
	}
});

async function deepFryAndReply(message, sourceImageURL){
	if (sourceImageURL) {
		const channel = client.channels.cache.get(message.channelId);
		channel.send('revving up fryers .... :smirk:');
		await lib.deepFry(sourceImageURL)
		message.reply({ files: ["output.jpeg"] })
	} else {
		message.reply('Couldn\'t find image to deep fry');
	}
}