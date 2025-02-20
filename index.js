require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 9000;
const app = express();
const server = http.createServer(app); //  Create an HTTP server
const io = new Server(server, {
  cors: { origin: "http://localhost:5173" }, //  Ensure CORS matches frontend
});

app.use(cors());
app.use(express.json());

//  Setup MongoDB connection
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.dr5qw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//  Initialize database outside `run()` so WebSockets can access it

async function run() {
  try {
    // await client.connect();

    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error(" MongoDB Connection Error:", error);
  }
}
run(); // Start the DB connection

const tasksCollection = client.db("taskManagerDb").collection("tasks");
const usersCollection = client.db("taskManagerDb").collection("users");
// API Routes
app.post("/users", async (req, res) => {
  const user = req.body;
  const query = { UserId: user.UserId };
  const isExist = await usersCollection.findOne(query);
  if (!isExist) {
    const result = await usersCollection.insertOne(user);
    res.send(result);
  }
});

app.get("/users", async (req, res) => {
  const result = await usersCollection.find().toArray();
  res.send(result);
});

app.post("/tasks", async (req, res) => {
  const task = req.body;
  const result = await tasksCollection.insertOne(task);
  res.send(result);

  // Emit real-time update
  io.emit("tasksUpdated", await tasksCollection.find().toArray());
});

app.get("/tasks", async (req, res) => {
  const result = await tasksCollection.find().toArray();
  res.send(result);
});

app.patch("/tasks/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const updatedDoc = { $set: req.body };
  const result = await tasksCollection.updateOne(query, updatedDoc);
  res.send(result);

  // Emit real-time update
  io.emit("tasksUpdated", await tasksCollection.find().toArray());
});

app.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };
  const result = await tasksCollection.deleteOne(query);
  res.send(result);

  // Emit real-time update
  io.emit("tasksUpdated", await tasksCollection.find().toArray());
});

// WebSocket Events
io.on("connection", (socket) => {
  console.log(" A user connected:", socket.id);

  //  Send latest tasks when a user connects
  socket.on("getTasks", async () => {
    const tasks = await tasksCollection.find().toArray();
    socket.emit("tasksUpdated", tasks);
  });

  socket.on("disconnect", () => {
    console.log(" A user disconnected:", socket.id);
  });
});

//  Ensure WebSockets work by using `server.listen()`, NOT `app.listen()`
server.listen(port, () => {
  console.log(` Server running on port ${port}`);
});
