require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 9000;
const app = express();
const http = require("http");

// Create a server using Express and HTTP
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    // await client.connect();
    // to post a user
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
    });
    app.get("/tasks", async (req, res) => {
      const result = await tasksCollection.find().toArray();
      res.send(result);
    });

    // PUT API to Update a Task
    app.patch("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const taskData = req.body;
      const updatedDoc = {
        $set: { ...taskData },
      };
      const result = await tasksCollection.updateOne(query, updatedDoc);
      res.send(result);
    });
    app.get("/task/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await tasksCollection.find(query).toArray();
      res.send(result);
    });

    // DELETE API to Remove a Task
    app.delete("/tasks/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await tasksCollection.deleteOne(query);
      res.send(result);
    });
    app.put("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const taskData = req.body;
      const updatedDoc = {
        $set: { ...taskData },
      };
      const result = await tasksCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("my task-manager server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
