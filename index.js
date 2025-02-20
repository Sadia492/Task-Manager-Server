require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 9000;
const app = express();
const { Server } = require("socket.io"); // Import the socket.io library
const http = require("http");

// Create a server using Express and HTTP
const server = http.createServer(app);

// Initialize the WebSocket server (Socket.io)
const io = new Server(server, {
  cors: { origin: "http://localhost:5173" }, // Make sure this matches your frontend URL
});
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.dr5qw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const tasksCollection = client.db("taskManagerDb").collection("tasks");
    const usersCollection = client.db("taskManagerDb").collection("users");
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // to post a user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
// WebSocket connection for real-time updates
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Listen for an 'updateTasks' event from the frontend
  socket.on("updateTasks", async () => {
    if (!db) {
      console.error("Database not connected");
      return;
    }
    try {
      // Fetch tasks from MongoDB and send them to the client
      const tasks = await db.collection("tasks").find().toArray();
      socket.emit("tasksUpdated", tasks); // Emit the updated tasks to the client
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

app.get("/", async (req, res) => {
  res.send("my task-manager server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
