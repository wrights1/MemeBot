// // Require the necessary discord.js classes
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const { Image } = require('image-js');
const sharp = require('sharp');
const axios = require('axios');

const fs = require('node:fs');
const path = require('node:path');

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
client.login(token);

client.on('messageCreate', async message => {
    // if (message.content.toLowerCase().startsWith('a')) {
    if (message.content.toLowerCase().startsWith('!deepfry')) {
        if (message.reference){
            const channel = client.channels.cache.get(message.channelId);
            channel.send('revving up fryers .... <:sus:1034185024695713792>');
            message.fetchReference().then(async function (replyMessage) {
                let sourceImageURL = replyMessage.attachments.size > 0 ? replyMessage.attachments.first()?.url : null
                if (sourceImageURL){
                    await deepFry(sourceImageURL);
                    message.reply({ files: ["./output.jpeg"] });
                } else {
                    message.reply('Couldn\'t find image to deep fry');
                }
              });
        } else if(message.attachments.size > 0){
            //not a reply but contains an image so like upload your own image and say !deepfry
            console.log('in message fry');
            let sourceImageURL = message.attachments.size > 0 ? message.attachments.first()?.url : null
                if (sourceImageURL){
                    await deepFry(sourceImageURL);
                    message.reply({ files: ["./output.jpeg"] });
                } else {
                    message.reply('Couldn\'t find image to deep fry');
                }
        }        
        else {
            message.reply('Gotta use this in reply to an image message');
        }
    } 
});

/* ============================================================
  Function: Download Image
============================================================ */

const download_image = (url, image_path) =>
  axios({
    url,
    responseType: 'stream',
  }).then(
    response =>
      new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(image_path))
          .on('finish', () => resolve())
          .on('error', e => reject(e));
      }),
  );

async function deepFry(sourceURL) {

    const width = 300;
    const height = 200;
    const text = "rachel is gay";

    const svgImage = `
    <svg width="${width}" height="${height}">
      <style>
      .title { fill: #001; font-size: 50px; font-weight: bold;}
      </style>
      <text x="50%" y="50%" text-anchor="middle" class="title">${text}</text>
    </svg>
    `;
    const svgBuffer = Buffer.from(svgImage);

    
    try {
        console.log('twerking up image');
        await download_image(sourceURL, 'source.png');
        var img = await sharp("source.png")
            .modulate({
                brightness: 0.3,
                saturation: 0.2,
            }).blur(3)
            .sharpen({
                sigma: 8,
                m1: 40,
                m2: 40,
                x1: 20,
                y2: 40,
                y3: 40,
            }).gamma(3)
            .normalise()
            .composite([
                {
                  input: svgBuffer,
                  top: 0,
                  left: 0,
                },
              ])
            .toBuffer()
            .then(async data => {
                const pixelArray = new Uint8ClampedArray(data.buffer);
                await sharp(pixelArray).toFile('output.jpeg');
            });
    } catch (error) {
        console.log(error); 
        // don't send if failed
    }
}
