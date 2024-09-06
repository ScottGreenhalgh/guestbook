// ----- Imports -----
import express, { response } from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import expressWs from "express-ws";

// ----- Server Setup -----
const app = express();
expressWs(app);
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
      "INSERT INTO guestbook (username, message, likes) VALUES ($1, $2, $3) RETURNING *",
      [username, message, likes]
    );
    // respond to client
    const newEntry = newGuestbook.rows[0];
    response.status(200).json(newGuestbook);
    //send update through websocket
    sendUpdate({ type: "newPost", data: newEntry });
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
    response.status(200).json({ success: true });
    //send update through websocket
    sendUpdate({ type: "deletePost", data: { id } });
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
    const updatedEntry = updatedGuestbook.rows[0];
    response.status(200).json(updatedEntry);
    //send update through websocket
    sendUpdate({ type: "updateLikes", data: updatedEntry });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to update likes" });
  }
});

// -------- Websocket ----------
let connectedClients = [];

app.ws("/guestbook", function (websocket, request) {
  console.log("New client connection from: " + request.socket.remoteAddress);
  // add client to connected array
  connectedClients.push(websocket);
  // client disconnect
  websocket.on("close", function () {
    console.log("Client disconnected: " + request.socket.remoteAddress);
    connectedClients = connectedClients.filter(
      (client) => client !== websocket
    );
  });
});
// send update to all clients
function sendUpdate(data) {
  connectedClients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// ------- Start Server -------
app.listen(8080, () => console.log("App running on port 8080"));
