const { REST, Routes } = require('discord.js');
require('dotenv').config();
const [CLIENT_ID, GUILD_ID, DISCORD_TOKEN] = [process.env.CLIENT_ID, process.env.GUILD_ID, process.env.DISCORD_TOKEN];
const fs = require('node:fs');
const mongoose = require('mongoose');
const { SlashCommandBuilder } = require('@discordjs/builders');

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

mongoose.connect(process.env.MONGO_URI).then(console.log('Connected to Mongodb.'));
//Schema model
let slashCommands = new mongoose.Schema({
	name: String,
	description: String,
	executionReply: String
});

let SlashCommands = mongoose.model('slash-commands', slashCommands);

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

// and deploy your commands!
(async () => {
	try {
		const results = await SlashCommands.find({});
		console.log(results);
		results.forEach((result) => {
			const command = {
				data: new SlashCommandBuilder()
					.setName(result.name)
					.setDescription(result.description),
				async execute(interaction) {
					await interaction.reply(result.executionReply);
				},

			}

			if ('data' in command && 'execute' in command) {
				console.log(`Adding command ${JSON.stringify(command)}`);
				// client.commands.set(command.data.name, command);
				commands.push(command.data.toJSON());
			} else {
				console.log(`[WARNING] The command at ${command} is missing a required "data" or "execute" property.`);
			}

		});


		// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
		for (const file of commandFiles) {
			const command = require(`./commands/${file}`);
			commands.push(command.data.toJSON());
		}

		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
		mongoose.connection.close();
	} catch (error) {

		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();