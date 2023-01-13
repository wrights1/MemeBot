const { SlashCommandBuilder } = require('discord.js');

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
		console.log(interaction);
		await interaction.reply(text);
	},
};