const axios = require('axios');
const fs = require('node:fs');
const Path = require('node:path');
const { AttachmentBuilder } = require('discord.js'); 
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB in bytes

const { registerFont, createCanvas, loadImage } = require('canvas');
registerFont('impact.ttf', { family: 'Impact' })

const sharp = require('sharp');

async function downloadImage (url, image_path) {
	const path = Path.resolve(__dirname, image_path)
	const writer = fs.createWriteStream(path)

	const response = await axios({
		method: 'GET',
		url: url,
		responseType: 'stream'
	})

	response.data.pipe(writer)

	return new Promise((resolve, reject) => {
		writer.on('close', resolve)
		writer.on('error', reject)
	})
}

async function deleteImgFiles(directory){
	fs.readdir(directory, (err, files) => {
		if (err) throw err;
		
		for (const file of files) {
			fs.unlink(Path.join(directory, file), (err) => {
			if (err) throw err;
			});
		}
		});
}

async function makeMeme(message, sourceURL){
	try {
		// Load the image
		const inputImagePath = 'img/input' +	Date.now() +'.jpeg';
		await downloadImage(sourceURL, inputImagePath);
		const image = await loadImage(inputImagePath);
		console.log('image.width = ' + image.width);
		console.log('image.height = ' + image.width);

		// Create a canvas with the same dimensions as the image and draw the image on the canvas
		const canvas = createCanvas(image.width, image.height);
		const ctx = canvas.getContext('2d');
		ctx.drawImage(image, 0, 0);
		
		// Set up text properties
		const fontFamily = 'Impact';
		const baseFontSize = 30; // Base font size for reference
		const fontScalingFactor = image.width / 700; // Adjust the reference width as needed
		const fontSize = Math.round(baseFontSize * fontScalingFactor);
		
		ctx.font = `${fontSize}px ${fontFamily}`;
		ctx.fillStyle = '#ffffff'; // Set text color
		ctx.strokeStyle = '#000000'; // Set outline color
		ctx.textAlign = 'center'; 
		
		const x = canvas.width / 2;
		const topY = canvas.height * 0.1;
		const bottomY = canvas.height * 0.9;
		const maxTextWidth = 0.8 * canvas.width;
		const lineHeight = 1.2 * fontSize; // Adjust line height as needed

		const topText= safeRegexMatch('t\=(.*) b\=', message);
		const bottomText= safeRegexMatch('b\=(.*)', message);

		console.log(topText);
		console.log(bottomText);

		if (topText !== null) {
			wrapText(ctx, topText.toUpperCase(), x, topY, maxTextWidth, lineHeight);
		}
			
		if ( bottomText !== null ){
			wrapText(ctx, bottomText.toUpperCase(), x, bottomY, maxTextWidth, lineHeight);
		}
		
		// Save the canvas as an image file
		const outputImagePath = inputImagePath.replace('in','out') 
		const buffer = canvas.toBuffer('image/png');
		require('fs').writeFileSync(outputImagePath, buffer);

		console.log(`Image with text saved to: ${outputImagePath}`);
		return outputImagePath;
		} catch (error) {
				console.log(error);
				throw new Error(error);
		}
}

function safeRegexMatch(pattern, text) {
	try {
		const regex = new RegExp(pattern); // Compile the regex
		const match = text.match(regex); // Execute the match
		return match ? match.slice(1)[0] : null;
	} catch (error) {
		console.error("Invalid regular expression:", error.message);
		return null;
	}
	}

// Wrap text function
function wrapText(context, text, x, y, maxWidth, lineHeight) {
	let words = text.split(' ');
	let line = '';
	for (let i = 0; i < words.length; i++) {
		let testLine = line + words[i] + ' ';
		let metrics = context.measureText(testLine);
		let testWidth = metrics.width;
		if (testWidth > maxWidth && i > 0) {
			context.fillText(line, x, y);
			context.strokeText(line, x, y);
			line = words[i] + ' ';
			y += lineHeight;
		} else {
			line = testLine;
		}
	}
	context.fillText(line, x, y);
	context.strokeText(line, x, y);
}

async function processImageStream(sourceUrl) {
	const response = await axios({
		method: 'get',
		url: sourceUrl,
		responseType: 'stream',
	});
	
	const transformer = sharp()
		.modulate({
			brightness: 0.3,
			saturation: 0.5 })
		.blur(3)
		.sharpen({
			sigma: 8,
			m1: 40,
			m2: 40,
			x1: 20,
			y2: 40,
			y3: 40 })
		.gamma(3)
		.normalise();
	
	const imageBuffer = await new Promise((resolve, reject) => {
		const chunks = [];
		response.data.pipe(transformer)
		.on('data', chunk => chunks.push(chunk))
		.on('end', () => resolve(Buffer.concat(chunks)))
		.on('error', reject);
	});
	
	return imageBuffer;
	}
	
	async function deepFry(message, sourceUrl) {
		try {
			const imageBuffer = await processImageStream(sourceUrl);
			const imageSize = imageBuffer.length; // Size in bytes
		
			console.log('Processed Image Size:', imageSize / 1024 / 1024, 'MB');
		
			if (imageSize > MAX_FILE_SIZE) {	
				const smallerImageBuffer = await sharp(imageBuffer)
					.resize(2048, 2048, {fit : 'inside'})
					.toBuffer();
		
				if (smallerImageBuffer.length <= MAX_FILE_SIZE) {
					const attachment = new AttachmentBuilder(smallerImageBuffer, { name: 'image.jpg' });
					await message.reply({content: 'Sorry for the wait, image was over 8MB and had to be resized to send', files: [attachment] });
				} else {
					await message.reply('Sorry, I don\'t have Nitro so the image is too large to send.');
				}
			} else {
				const attachment = new AttachmentBuilder(imageBuffer, { name: 'image.jpg' });
				await message.reply({ files: [attachment] });
			}
		} catch (error) {
			console.error('Error processing image:', error);
			message.reply('There was an error processing the image :(');
		}
	}
	
module.exports = {downloadImage, deepFry, makeMeme, deleteImgFiles};