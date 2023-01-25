const { SlashCommandBuilder } = require('discord.js');
const lib = require('../lib.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('deepfry')
		.setDescription('Deep Fry with options')
        .addStringOption(option =>
			option
				.setName('url')
				.setDescription('image URL')),
	async execute(interaction) {
        const url = interaction.options.getString('url') ?? 'No url provided';
		await lib.deepFry(url);
		await interaction.reply({ files: ["./output.jpeg"] });
	},
};

