const { SlashCommandBuilder } = require('discord.js');
const lib = require('../lib.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('meme')
		.setDescription('make a da meme')
        .addStringOption(option =>
			option
				.setName('text')
				.setDescription('text of the meme')),
	async execute(interaction) {
        const text = interaction.options.getString('text') ?? 'No text provided';
		download_image(text, 'memeout.png');
		//console.log(interaction);
		await interaction.reply({ files: ["./memeout.png"] });
	},
};

