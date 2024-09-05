import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Pool({
  connectionString: process.env.DB_URL,
});

const templateUsername = ["BigSteve", "Jeff", "fancyusername", "Apple"];
const templateMessage = [
  "Steve message",
  "My name is Jeff",
  "super fancy message",
  "Fell from a tree",
];
//PostgreSQL
async function resetDb() {
  await db.query("TRUNCATE guestbook RESTART IDENTITY");
  for (let i = 0; templateUsername.length > i; i++) {
    await db.query(
      "INSERT INTO guestbook (username, message) VALUES ($1, $2)",
      [templateUsername[i], templateMessage[i]]
    );
  }
}

resetDb();
