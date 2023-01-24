const Sharp = require('sharp');
const Axios = require('axios');

const Fs = require('node:fs');
const Path = require('node:path');

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
		writer.on('finish', resolve)
		writer.on('error', reject)
	})
}
	
async function deepFry(sourceURL) {
	const width = 300;
	const height = 200;
	const text = "bottom text";
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
		await downloadImage(sourceURL, 'source.jpeg');
		return Sharp("source.jpeg")
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
			.composite([{
				input: svgBuffer,
				top: 0,
				left: 0,
			} ])
		.toFile('output.jpeg');
	} catch (error) {
		console.log(error);
		throw new Error(error);
	}
}
	
module.exports = {downloadImage, deepFry};