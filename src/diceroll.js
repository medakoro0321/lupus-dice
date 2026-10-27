import { Events, GatewayIntentBits, Partials, EmbedBuilder } from 'discord.js';
import { getIgnoreChannel, handleIgnoreChannelCommand } from './ignoreChannel.js';

export const messageClientOptions = {
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
};

// ダイスコマンド判定
const diceRegex = /^(\d+)d(\d+)(?: +(\d+))?(?: +(.*))?$/;
const shortDiceRegex = /^dd$/;

export async function handleMessage(message) {
  if (message.author.bot || message.webhookId) return;

  const reply = message.content;
  if (!reply) return;

  if (await handleIgnoreChannelCommand(message)) return;

  if ((shortDiceRegex.test(reply) || diceRegex.test(reply)) &&
      getIgnoreChannel(message.channelId)) return;

  if (reply == "echo") {
    // echo  
    await sendEchoMessage(message, reply);
  } else if (shortDiceRegex.test(reply)) {
    await shortDiceRoll(message); // dd
  } else if (diceRegex.test(reply)) {
    await diceRoll(message, reply);
  }
}

async function sendEchoMessage(message, reply) {
  console.log(reply);

  await message.reply({
    content: reply,
    allowedMentions: { 
      parse: [],
      repliedUser: false
    }
  });
}

// shortDiceRoll(dd)
async function shortDiceRoll(message) {
  const result = generateRandom(100);

  await message.reply({
    content: `--> ${result.toString()}`
  });
}

async function diceRoll(message, reply) {
  const match = reply.match(diceRegex);
  if (!match) return;

  const count = Number(match[1]);
  const diceFace = Number(match[2]);

  const isChecking = match[3] !== undefined;
  const checkingNumber = isChecking ? Number(match[3]) : 0;

  const comment = match[4] ?? "";

  if (!Number.isSafeInteger(count) || !Number.isSafeInteger(diceFace) || !Number.isSafeInteger(checkingNumber) || count < 1 || count > 10000000 || diceFace < 1 || diceFace > 10000000) {
    await message.reply("ダイスの指定が無効です。");
    return;
  }

  const diceLog = [];
  let sumDice = 0;

  for (let i = 0; i < count; i++) {
    const result = generateRandom(diceFace);
    diceLog.push(result);
    sumDice += result;
  }

  const replyMessage = sendReplyMessage(message, isChecking, count, diceFace, sumDice, checkingNumber, diceLog.join(","));
}

async function sendReplyMessage(message, isChecking, diceCount, diceFace, sumDice, checkNumber, diceLog) {
  let shortContent = `--> ${diceLog}`;
  let resultText = "";
  let resultDice = "";
  let color = 0x57F287;

  if (isChecking) {
    if (diceCount == 1 && diceFace == 100) {
      if (sumDice <= checkNumber) {
        if (sumDice <= 5) {
          resultText = "--> 決定的成功! [クリティカル]";
          color = 0xFEE75C;
        } else {
          resultText = "--> 成功";
          color = 0x57F287;
        }
      } else {
        if (sumDice >= 95) {
          resultText = "--> 致命的失敗! [ファンブル]";
          color = 0x9B59B6;
        } else {
          resultText = "--> 失敗";
          color = 0xED4245;
        }
      }
    } else {
      if (sumDice <= checkNumber) {
        resultText = "--> 成功";
        color = 0x57F287;
      } else {
        resultText = "--> 失敗";
        color = 0xED4245;
      }
    }

    resultDice = `--> ${sumDice} <= ${checkNumber}`;
  } else {
    resultDice = `--> ${sumDice}`;
  }

  if (diceLog.length >= 1800) shortContent = `--> [数値省略 文字数: ${diceLog.length} >2000]`;

  const embed = new EmbedBuilder()
  .setTitle(`${diceCount}d${diceFace}`)
  .addFields(
    { name: "MidCalcu:", value: `${shortContent}`},
    { name: "Rolled:", value: `${resultDice}`, inline: true},
    { name: "Result:", value: `${resultText}`, inline: true}
  )
  .setColor(color)
  .setFooter({ text: "わぅ!" })
  .setTimestamp();
  
  await message.reply({
    embeds: [embed],
    allowedMentions: {
      repliedUser: false
    }
  })
}

function generateRandom(max) {
  return Math.floor(Math.random() * max) + 1;
}

export function registerMessageHandler(client) {
  client.on(Events.MessageCreate, (message) => {
    handleMessage(message).catch((error) => {
      console.error('Failed to handle incoming message.', error);
    });
  });
}
