import { Client, Events } from 'discord.js';
import { messageClientOptions, registerMessageHandler } from './diceroll.js';

const token = process.env.BOTTOKEN?.trim();
if (!token) {
  console.error('BOTTOKEN is empty. Set it in .env before starting the bot.');
  process.exit(1);
}
const client = new Client(messageClientOptions);
registerMessageHandler(client);
client.once(Events.ClientReady, readyClient => console.log('Logged in as ' + readyClient.user.tag));
client.on(Events.Error, () => console.error('Discord client error.'));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => { client.destroy(); process.exit(0); });
}
try {
  await client.login(token);
} catch {
  console.error('Discord login failed. Check BOTTOKEN and network connectivity.');
  client.destroy();
  process.exit(1);
}
