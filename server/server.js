// ----- Imports -----
import express, { response } from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";

// ----- Server Setup -----
const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();
// connect db
const db = new pg.Pool({
  connectionString: process.env.DB_URL,
});

// --------- GET Endpoints --------
app.get("/", function (request, response) {
  response.json("root route");
});

// Guestbook get endpoint
app.get("/guestbook", async function (request, response) {
  try {
    const guestbook = await db.query("SELECT * FROM guestbook ORDER BY id ASC");
    response.status(200).json(guestbook.rows); // respond to the client, code 200 = success
  } catch (error) {
    console.error(error); // error code 500 = internal server error
    response.status(500).json({ error: "Failed to retrieve database" });
  }
});

// --------- POST Endpoints --------
app.post("/guestbook", async function (request, response) {
  try {
    console.log(request.body);
    const { username, message, likes = 0 } = request.body; //default 0 likes
    // db insert query
    const newGuestbook = await db.query(
      "INSERT INTO guestbook (username, message) VALUES ($1, $2, $3) RETURNING *",
      [username, message, likes]
    );
    // respond to client
    response.status(200).json(newGuestbook.rows[0]);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to add entry" });
  }
});

// --------- DELETE Endpoints ----------
app.delete("/guestbook/:id", async function (request, response) {
  const id = request.params.id;

  try {
    await db.query("DELETE FROM guestbook WHERE id = $1", [id]);
    response.status(200);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to delete entry" });
  }
});

// ---------- PUT Endpoints ----------
app.put("/guestbook/:id/like", async function (request, response) {
  const id = request.params.id;
  const { action } = request.body;

  try {
    const query =
      action === "like"
        ? "UPDATE guestbook SET likes = likes + 1 WHERE id = $1 RETURNING *"
        : "UPDATE guestbook SET likes = likes - 1 WHERE id = $1 RETURNING *";

    const updatedGuestbook = await db.query(query, [id]);

    response.status(200).json(updatedGuestbook.rows[0]);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to update likes" });
  }
});

// ------- Start Server -------
app.listen(8080, () => console.log("App running on port 8080"));
