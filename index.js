const express = require('express');
const cors = require('cors');
const { MongoClient,ObjectId , ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// ✅ Replace with your actual MongoDB connection string
const uri = "mongodb+srv://bishalbondhon20_db_user:2UQeJeRTZXLJvBfn@cluster0.bd8m97l.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;
let featuredCollection;

async function run() {
  try {
    await client.connect();
    db = client.db("moviemasterpro");
    featuredCollection = db.collection("featuredMovies");
    console.log("✅ Connected to MongoDB");

    // ✅ Start server only after successful DB connection
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });

  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
}
run().catch(console.dir);

// ✅ Upload featured movie
app.post('/upload-json', async (req, res) => {
  const movie = req.body;

  if (!movie || typeof movie !== 'object') {
    return res.status(400).json({ message: 'Invalid JSON data' });
  }

  try {
    const result = await featuredCollection.insertOne(movie);
    res.status(200).json({ message: 'Movie uploaded successfully', id: result.insertedId });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Failed to upload movie' });
  }
});

// ✅ Get featured movies
app.get('/featured', async (req, res) => {
  try {
    const movies = await featuredCollection.find().toArray();
    res.json(movies);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch movies' });
  }
});

// ✅ Add movie (this route your frontend will use)
app.post('/movies/add', async (req, res) => {
  const movie = req.body;

  if (!movie || typeof movie !== 'object') {
    return res.status(400).json({ message: 'Invalid movie data' });
  }

  try {
    const result = await db.collection('movies').insertOne(movie);
    res.status(201).json({ message: 'Movie added successfully', id: result.insertedId });
  } catch (err) {
    console.error('Upload error (/movies/add):', err);
    res.status(500).json({ message: 'Failed to upload movie' });
  }
});


// ✅ Get all movies
app.get('/movies', async (req, res) => {
  try {
    const movies = await db.collection('movies').find({}).toArray();
    res.status(200).json(movies);
  } catch (err) {
    console.error('Fetch error (/movies):', err);
    res.status(500).json({ message: 'Failed to fetch movies' });
  }
});



// ✅ Get top-rated movies
app.get('/toprated', async (req, res) => {
  try {
    const movies = await db
      .collection('movies')
      .find({})
      .sort({ rating: -1 })
      .limit(5)
      .toArray();

    res.json(movies);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch top-rated movies' });
  }
});


// ✅ Get movies added by a specific user
app.get('/movies/my/:email', async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const movies = await db.collection('movies').find({ addedBy: email }).toArray();
    res.status(200).json(movies);
  } catch (err) {
    console.error('Fetch error (/movies/my):', err);
    res.status(500).json({ message: 'Failed to fetch user movies' });
  }
});



// Delete movie
app.delete("/movies/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.collection("movies").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ message: "Movie not found" });
    res.json({ message: "Movie deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete movie" });
  }
});

// Get single movie by ID (for update form)
app.get("/movies/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const movie = await db.collection("movies").findOne({ _id: new ObjectId(id) });
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json(movie);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch movie" });
  }
});

// const { ObjectId } = require("mongodb");

app.put("/movies/update/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  // Remove _id if present in the body (MongoDB does not allow updating _id)
  if (updatedData._id) delete updatedData._id;

  try {
    const result = await db.collection("movies").updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json({ message: "Movie updated successfully" });
  } catch (err) {
    console.error("Update movie error:", err);
    res.status(500).json({ message: "Failed to update movie" });
  }
});


