const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.resolve(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

// Sample matches data
const sampleMatches = [
  // Premier League matches
  {
    home_team: 'Arsenal',
    away_team: 'Chelsea',
    league: 'Premier League',
    start_time: '2025-08-30T17:30:00Z',
    status: 'upcoming'
  },
  {
    home_team: 'Manchester City',
    away_team: 'Liverpool',
    league: 'Premier League',
    start_time: '2025-08-31T15:00:00Z',
    status: 'upcoming'
  },
  {
    home_team: 'Tottenham',
    away_team: 'Manchester United',
    league: 'Premier League',
    start_time: '2025-09-01T14:00:00Z',
    status: 'upcoming'
  },

  // La Liga matches
  {
    home_team: 'Real Madrid',
    away_team: 'Barcelona',
    league: 'La Liga',
    start_time: '2025-08-29T20:00:00Z',
    status: 'upcoming'
  },
  {
    home_team: 'Atletico Madrid',
    away_team: 'Sevilla',
    league: 'La Liga',
    start_time: '2025-08-30T18:30:00Z',
    status: 'upcoming'
  },
  {
    home_team: 'Valencia',
    away_team: 'Real Sociedad',
    league: 'La Liga',
    start_time: '2025-09-01T16:00:00Z',
    status: 'upcoming'
  },

  // Champions League matches
  {
    home_team: 'Bayern Munich',
    away_team: 'PSG',
    league: 'Champions League',
    start_time: '2025-08-28T21:00:00Z',
    status: 'upcoming'
  },
  {
    home_team: 'Inter Milan',
    away_team: 'Real Madrid',
    league: 'Champions League',
    start_time: '2025-09-02T21:00:00Z',
    status: 'upcoming'
  },
  {
    home_team: 'Manchester City',
    away_team: 'Borussia Dortmund',
    league: 'Champions League',
    start_time: '2025-09-03T21:00:00Z',
    status: 'upcoming'
  }
];

console.log('Adding sample matches to database...');

// Insert matches
const insertMatch = db.prepare(`
  INSERT INTO matches (id, home_team, away_team, league, start_time, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertOdds = db.prepare(`
  INSERT INTO odds (id, match_id, home_odds, draw_odds, away_odds, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

sampleMatches.forEach((match, index) => {
  const timestamp = Date.now();
  const matchId = `match_${timestamp}_${index + 1}`;
  const now = new Date().toISOString();

  // Insert match
  insertMatch.run(
    matchId,
    match.home_team,
    match.away_team,
    match.league,
    match.start_time,
    match.status,
    now,
    now
  );

  // Generate random odds
  const homeOdds = (Math.random() * 3 + 1).toFixed(2);
  const drawOdds = (Math.random() * 4 + 2).toFixed(2);
  const awayOdds = (Math.random() * 3 + 1).toFixed(2);

  // Insert odds
  const oddsId = `odds_${timestamp}_${index + 1}`;
  insertOdds.run(
    oddsId,
    matchId,
    parseFloat(homeOdds),
    parseFloat(drawOdds),
    parseFloat(awayOdds),
    now,
    now
  );

  console.log(`Added: ${match.home_team} vs ${match.away_team} (${match.league})`);
});

console.log('✅ Sample matches added successfully!');
console.log(`Total matches added: ${sampleMatches.length}`);

// Close database connection
db.close();