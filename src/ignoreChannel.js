import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve relative to this file, regardless of the working directory.
const dataFile = fileURLToPath(new URL('../data/diceIgnoreChannelData.json', import.meta.url));

function normalizeChannelId(channelId) {
  if (typeof channelId === 'number') {
    if (!Number.isSafeInteger(channelId) || channelId <= 0) {
      throw new TypeError('channelId must be a positive safe integer; use a string for Discord IDs.');
    }
  } else if (typeof channelId !== 'string' && typeof channelId !== 'bigint') {
    throw new TypeError('channelId must be a string, bigint, or safe integer.');
  }

  const id = String(channelId);
  if (!/^[1-9]\d*$/.test(id)) {
    throw new TypeError('channelId must contain a positive integer ID.');
  }
  return id;
}

function readChannelIds() {
  mkdirSync(dirname(dataFile), { recursive: true });
  if (!existsSync(dataFile)) {
    try {
      writeFileSync(dataFile, '[]\n', { encoding: 'utf8', flag: 'wx' });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }

  const data = JSON.parse(readFileSync(dataFile, 'utf8'));
  if (!Array.isArray(data)) {
    throw new TypeError('diceIgnoreChannelData.json must contain an array of channel IDs.');
  }
  return [...new Set(data.map(normalizeChannelId))];
}

function writeChannelIds(channelIds) {
  const temporaryFile = dataFile + '.' + process.pid + '.tmp';
  try {
    writeFileSync(temporaryFile, JSON.stringify(channelIds, null, 2) + '\n', 'utf8');
    renameSync(temporaryFile, dataFile);
  } finally {
    rmSync(temporaryFile, { force: true });
  }
}

export function channelIgnore(message) {
  const channelId = normalizeChannelId(message?.channelId ?? message?.channel?.id);
  const channelIds = readChannelIds();
  const index = channelIds.indexOf(channelId);
  const added = index === -1;

  if (added) channelIds.push(channelId);
  else channelIds.splice(index, 1);

  writeChannelIds(channelIds);
  return added;
}

export function getIgnoreChannel(channelId) {
  const id = normalizeChannelId(channelId);
  return readChannelIds().includes(id);
}

// Returns true when the message was handled as an ignore command.
export async function handleIgnoreChannelCommand(message) {
  if (message.author.bot || message.webhookId || message.content !== '!woof') {
    return false;
  }

  const ignored = channelIgnore(message);
  await message.reply({
    content: ignored ? 'DICEROLL: OFF' : 'DICEROLL: ON',
    allowedMentions: { parse: [], repliedUser: false },
  });
  return true;
}
