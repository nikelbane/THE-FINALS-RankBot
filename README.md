# The Finals Rank Bot

A Discord bot that provides ranking information for The Finals game, including graphical representations of player stats.

## Features

- Fetches player rankings and stats
- Generates charts and graphs using Chart.js
- Discord integration for easy access

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd theFinalsRankBot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory according to the following:

   ```
    # Discord bot token
    DISCORD_TOKEN=XXXXXXXXXXXXXXXX
    # Guild (Server) id where you want to register commands during development
    GUILD_ID=XXXXXXXXXXXXXXXXXXXXX
    # Discord channel ID where the bot will post rank updates
    CHANNEL_ID=XXXXXXXXXXXXXXXXXXXX

    # THE FINALS API URL template
    API_URL_TEMPLATE=https://api.the-finals-leaderboard.com/v1/leaderboard/s9/crossplay?name={username}
    # THE FINALS Stats URL template.
    STATS_URL_TEMPLATE=https://www.davg25.com/app/the-finals-leaderboard-tracker/api/vaiiya/player-overview/

    # Role JSON mapping (string) that maps incoming rank values to role names
    ROLE_MAPPINGS_JSON="{"GOLD": "144827612XXXXXXXXXXXXXX","PLATINUM": "1448276XXXXXXXXXXXXX","DIAMOND": "144827621XXXXXXXXX","RUBY": "14482762XXXXXXXXXX"}"
   ```

## Usage

1. Build the project:

   ```bash
   npm run build
   ```

2. Register the bot commands:

   ```bash
   npm run register
   ```

3. Start the bot:
   ```bash
   npm start
   ```

For development:

```bash
npm run dev
```

## Scripts

- `npm run dev`: Run in development mode with hot reload
- `npm run build`: Build the TypeScript code
- `npm run register`: Register Discord commands
- `npm start`: Start the production bot

## Dependencies

- discord.js: Discord API wrapper
- axios: HTTP client for API requests
- chart.js & chartjs-node-canvas: Chart generation
- dotenv: Environment variable management

## License

MIT
