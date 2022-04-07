// Import Postgres Pool
const { Pool } = require("pg");

let url =
  "postgres://zfjgylrnibjiea:f97f496c8187ddfe4a079de4e9d57c658db1b2ea34bd00c5dd17f0b140cc6f1e@ec2-34-197-84-74.compute-1.amazonaws.com:5432/d4e1avtgkdh834";

// Koneksi
const dbPool = new Pool({
  connectionString: url,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = dbPool;
