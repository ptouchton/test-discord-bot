//Full code example
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const messageCountSchema = require('./models/message-count-schema');
const { SlashCommandBuilder } = require('@discordjs/builders');

require('dotenv').config({ path: path.resolve(__dirname, '.env') })
const TOKEN = process.env.DISCORD_TOKEN


// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    mongoose.connect(process.env.MONGO_URI).then(console.log('Connected to Mongodb.'));
});

// Log in to Discord with your client's token
client.login(TOKEN);


//Schema model
let slashCommands = new mongoose.Schema({
    name: String,
    description: String,
    executeReply: String
});

let SlashCommands = mongoose.model('slash-commands', slashCommands);

async function getSlashCommands() {

    const Items = await SlashCommands.find({});
    return Items;

}

client.commands = new Collection();
getSlashCommands().then((results) => {
    console.log(results);
    results.forEach((result) => {
        const command = {
            data: new SlashCommandBuilder()
                .setName(result.name)
                .setDescription(result.description),
            async execute(interaction) {
                await interaction.reply(result.executeReply);
            },

        }

        if ('data' in command && 'execute' in command) {
            console.log(`Adding command ${JSON.stringify(command)}`);
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${command} is missing a required "data" or "execute" property.`);
        }
    });


    // client.commands = new Collection();
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            console.log(`Adding command ${JSON.stringify(command)}`);
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

});


client.on(Events.InteractionCreate, async interaction => {
    //console.log(`interaction: ${JSON.stringify(interaction)}`);
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on(Events.MessageCreate, async (message) => {

    const { member: { id }, author: { bot } } = message;

    if (bot) return;

    const memberId = id;

    const result = await messageCountSchema.findOneAndUpdate(
        {
            _id: memberId
        },
        {
            $inc: {
                messageCount: 1
            }
        },
        {
            upsert: true,
            new: true
        }
    );

    console.log(`Message count for member with ID ${memberId} is now ${result.messageCount}.`)
});




