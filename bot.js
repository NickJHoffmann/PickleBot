const fs = require("fs");
const Discord = require("discord.js");
const {token, prefix, defaultCooldown} = require("./config.json");

const bot = new Discord.Client();
bot.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    bot.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection();

bot.once('ready', () => {
    console.log(`${bot.user.username} is connected!`);
    bot.user.setPresence({
        activity: {
            name: "!dt trivia"
        }
    }).then(m => console.log(`Set status to "${m.activities[0].name}"`)).catch(console.error);
});

bot.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (!bot.commands.has(commandName)) return;

    const command = bot.commands.get(commandName);


    //Manage cooldowns
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || defaultCooldown) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    //Command execution
    try {
        command.execute(message, args);
    } catch (error) {
        console.log(error);
        message.reply("Error executing that command")
    }
});

bot.login(token).catch(console.error);