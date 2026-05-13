import * as fs from "fs";
import * as path from "path";
import { Pool } from "pg";

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  console.log("Running migrations...");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const migrationsPath = path.join(
    process.cwd(),
    "src/database/migrations",
  );

  const files = fs
    .readdirSync(migrationsPath)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const existing = await pool.query(
      `
      SELECT id
      FROM migrations
      WHERE filename = $1
      `,
      [file],
    );

    if (existing.rows.length > 0) {
      console.log(`Skipping ${file}`);
      continue;
    }

    console.log(`Executing ${file}`);

    const sql = fs.readFileSync(
      path.join(migrationsPath, file),
      "utf8",
    );

    await pool.query(sql);

    await pool.query(
      `
      INSERT INTO migrations(filename)
      VALUES($1)
      `,
      [file],
    );

    console.log(`Completed ${file}`);
  }

  await pool.end();

  console.log("All migrations completed");
}

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});