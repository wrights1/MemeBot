const { SlashCommandBuilder } = require('discord.js');
const lib = require('../lib.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('meme')
		.setDescription('make a da meme')
        .addStringOption(option =>
			option
				.setName('url')
				.setDescription('URL of image to add text to')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('toptext')
				.setDescription('Top text of the meme'))
		.addStringOption(option =>
			option
				.setName('bottomtext')
				.setDescription('Bottom text of the meme'))
		.addBooleanOption(option =>
			option
				.setName('deepfry')
				.setDescription('Optionally deep fry your image')),
	async execute(interaction) {
		await lib.deleteImgFiles('img');
        const url = interaction.options.getString('url') ?? 'No URL provided';
        const toptext = interaction.options.getString('toptext') ?? '';
        const bottomtext = interaction.options.getString('bottomtext') ?? '';
		let outputFilename = url;
		if (toptext != '' && bottomtext != ''){
			outputFilename = await lib.makeMeme('t=\"'+toptext+'\" b=\"'+bottomtext+'\"', url);
		}
		if (interaction.options.getBoolean('deepfry')){
			await lib.deepFry(outputFilename);
			await interaction.reply({ files: ['output.jpeg'] });
		} else {
			await interaction.reply({ files: [outputFilename] });
		}
	},
};

