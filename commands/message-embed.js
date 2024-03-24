const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('message-embed')
		.setDescription('Allows Mods to send message embeds via YAML'),
	async execute(interaction) {
		await interaction.reply('Yay! You did it!');
	},
};