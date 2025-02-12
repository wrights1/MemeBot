const Axios = require('axios');

const Fs = require('node:fs');
const Path = require('node:path');

const { registerFont, createCanvas, loadImage } = require('canvas');
registerFont('impact.ttf', { family: 'Impact' })

const Sharp = require('sharp');

async function downloadImage (url, image_path) {
	const path = Path.resolve(__dirname, image_path)
	const writer = Fs.createWriteStream(path)

	const response = await Axios({
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
	Fs.readdir(directory, (err, files) => {
		if (err) throw err;
	  
		for (const file of files) {
		  Fs.unlink(Path.join(directory, file), (err) => {
			if (err) throw err;
		  });
		}
	  });
}

async function makeMeme(message, sourceURL){
	try {
		// Load the image
		const inputImagePath = 'img/input' +  Date.now() +'.jpeg';
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

async function deepFry(sourceURL) {
	try {
		console.log('twerking up image');
		let imgFilename = sourceURL;
		if ( !sourceURL.startsWith('img/')){ //if sourceURL starts with "img/" then it is a local file passed in by the meme function, not a URL
			imgFilename = 'source.jpeg';
			await downloadImage(sourceURL, 'source.jpeg');
		}
		return Sharp(imgFilename)
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
			.normalise()
		.toFile('output.jpeg');
	} catch (error) {
		console.log(error);
		throw new Error(error);
	}
}
	
module.exports = {downloadImage, deepFry, makeMeme, deleteImgFiles};