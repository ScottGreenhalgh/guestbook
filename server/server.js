//imports
import express, { response } from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";

//server setup
const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

// connect db
const db = new pg.Pool({
  connectionString: process.env.DB_URL,
});

// GET and POST
app.get("/", function (request, response) {
  response.json("root route");
});

// endpoint for the database queries
app.get("/guestbook", async function (request, response) {
  const guestbook = await db.query("SELECT * FROM guestbook");
  response.json(guestbook.rows); // respond to the client
});

// endpoint to post to database
app.post("/guestbook", async function (request, response) {
  console.log(request.body);
  const username = request.body.username;
  const message = request.body.message;

  // db insert query
  const newGuestbook = await db.query(
    "INSERT INTO guestbook (username, message) VALUES ($1, $2)",
    [username, message]
  );
  // respond to client
  response.json(newGuestbook);
});

//start server
app.listen(8080, () => console.log("App running on port 8080"));
