import dotenv from 'dotenv';
import Discord, { Client, MessageEmbed } from 'discord.js';
import chalk from 'chalk';
// @ts-ignore
import blackjack from 'discord-blackjack';
import fs from 'fs';
import { User } from './types';
import { readFromJson } from './utils/readFromJson';

(async () => {
  const prefix = '$';
  const defaultBalance = 100;

  const users: User[] = [];

  const fileExists = fs.existsSync('./data.json');

  if (fileExists) {
    const file = fs.readFileSync('./data.json');
    const objs = readFromJson(file.toString());
    objs.map((obj: any) => {
      users.push(obj);
    });
  }

  dotenv.config();

  const client = new Client({
    intents: [
      'DIRECT_MESSAGES',
      'GUILD_MESSAGES',
      'GUILD_MESSAGE_REACTIONS',
      'GUILDS',
    ],
  });

  client.on('messageCreate', async message => {
    if (
      message.author.bot ||
      !message.guild ||
      !message.content.startsWith(prefix)
    )
      return;

    const usr = users.filter(usr => usr.id === message.author.id)[0];

    if (message.content.startsWith(`${prefix}blackjack`)) {
      if (!usr) {
        const noUserEmbed = new MessageEmbed({
          title: 'You are not registered!',
          description:
            "You're not registered therefor you're not allowed to compete.\nPlease run the $register command!",
          color: 'RED',
        });

        message.reply({ embeds: [noUserEmbed] });
        return;
      }

      const bet = message.content.slice(10);

      if (!bet) {
        const errorEmbed = new MessageEmbed({
          title: 'No bet provided',
          description:
            'You have to bet something!\n To bet type the amount you want to bet after the command!',
          color: 'RED',
        });
        message.reply({ embeds: [errorEmbed] });
        return;
      }

      let game = await blackjack(message, Discord, { resultEmbed: false });

      console.log(game.result);

      switch (game.result) {
        case 'Win': // do win stuff here
          const newBalance = usr.balance + parseInt(bet);
          usr.balance = newBalance;
          fs.writeFile('./data.json', JSON.stringify(users), err => {
            if (err) console.log(err);
          });
          const winEmbed = new MessageEmbed({
            title: 'You Won!',
            description: `You won ${bet}`,
            color: 'GREEN',
          });
          message.channel.send({ embeds: [winEmbed] });

          break;
        case 'Tie': // do tie stuff here
          break;
        case 'Lose': // do lose stuff here
          const newBal = usr.balance - parseInt(bet);
          usr.balance = newBal;

          fs.writeFile('./data.json', JSON.stringify(users), err => {
            if (err) console.log(err);
          });

          const embed = new MessageEmbed({
            title: 'You Lost!',
            description: `Reason: ${game.method}. Try again next time!\nYou lost ${bet}`,
            color: 'RED',
          });
          message.channel.send({ embeds: [embed] });
          break;
        case 'Double Win': // do double win stuff here
          break;
        case 'Double Lose': // do double lose stuff here
          break;
        case 'ERROR': // do whatever you want
          break;
      }

      return;
    }

    if (message.content.startsWith(`${prefix}register`)) {
      const usersWithSameID = users.filter(usr => usr.id === message.author.id);

      if (usersWithSameID.length > 0) {
        const embed = new MessageEmbed({
          title: 'You are already registered!',
          description: "What are you doing\nYou're already registered!",
          color: 'RED',
        });
        message.reply({ embeds: [embed] });

        return;
      }

      const payload = {
        id: message.author.id,
        name: message.author.username,
        balance: defaultBalance,
      };
      users.push(payload);

      fs.writeFile('./data.json', JSON.stringify(users), err => {
        if (err) console.log(err);
      });

      const embed = new MessageEmbed({
        title: 'Registered!',
        description: `You're now registered!\nYour balance is ${defaultBalance}`,
        color: 'GREEN',
      });
      message.reply({ embeds: [embed] });
    }

    if (message.content.startsWith(`${prefix}bal` || `${prefix}balance`)) {
      const embed = new MessageEmbed({
        title: 'Your balance',
        description: `Your current balance is ${usr.balance}`,
        color: 'YELLOW',
      });

      message.reply({ embeds: [embed] });
    }

    if (message.content.startsWith(`${prefix}help`)) {
      const embed = new MessageEmbed({
        title: 'HELP',
        description:
          "$register: Get started with 100 credits (You need to run this before you're allowed to play\n$bal: Get your current balance\n$blackjack: Play some blackjack",
        color: 'YELLOW',
      });
      message.reply({ embeds: [embed] });
    }
  });

  await client.login(process.env.TOKEN);
  console.log(chalk.green('Discord bot online!'));
})();
