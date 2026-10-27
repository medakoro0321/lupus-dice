# lupus-dice

Docker Compose environment: Node.js 24 and Discord.js 14.
Incoming guild messages and DMs are handled in src/message-handler.js.
Only the exact text echo receives the reply echo. Bot/webhook messages are ignored.

1. Set BOTTOKEN in .env.
2. Start: docker compose up -d --build
3. Logs: docker compose logs -f bot

Stop: docker compose down
After source changes: docker compose up -d --build
Syntax check: docker compose run --rm --no-deps bot npm run check

.env is excluded from Git and Docker images.
Dependencies are locked in package-lock.json and installed with npm ci.
No inbound ports are required.
Enable Message Content Intent under Bot > Privileged Gateway Intents in the Discord Developer Portal.
The bot needs View Channel, Send Messages, and Read Message History permissions in the target channels.
Triggers/replies can be edited in the replies Map in src/message-handler.js.
Matching is case-sensitive and includes whitespace.
