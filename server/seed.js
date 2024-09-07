import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Pool({
  connectionString: process.env.DB_URL,
});

const templateUsername = [
  "Donkey",
  "Lord Farquaad",
  "Gingerbread Man",
  "Shrek",
];
const templateMessage = [
  "Donkey, you have the right to remain silent. What you lack is the capacity.",
  "Some of you may die, but it's a sacrifice Im willing to make.",
  "Fire up the ovens, Muffin Man! We've got a big order to fill.",
  "Someday, I will repay you. Unless, of course, I can't find you. Or I forget.",
];
const defaultLikes = 0;
//PostgreSQL
async function resetDb() {
  //remove all data, reset identity back to start counting from 1
  await db.query("TRUNCATE guestbook RESTART IDENTITY");
  for (let i = 0; templateUsername.length > i; i++) {
    await db.query(
      "INSERT INTO guestbook (username, message, likes) VALUES ($1, $2, $3)",
      [templateUsername[i], templateMessage[i], defaultLikes]
    );
  }
}

resetDb();
console.log("resetting database");

// Table created with:

// CREATE TABLE guestbook (
//   id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
//   username TEXT,
//   message TEXT,
//   likes INT
// );
