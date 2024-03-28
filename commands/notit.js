const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notit')
        .setDescription('Please dont work'),

    async execute(interaction) {
        await interaction.reply('sorry');
    },
};