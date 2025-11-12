const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const uri = "mongodb+srv://bishalbondhon20_db_user:381QvZ6fcQUozxEw@cluster0.bd8m97l.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let featuredCollection;

async function run() {
  try {
    await client.connect();
    const db = client.db("moviemasterpro");
    featuredCollection = db.collection("featuredMovies");

    await db.command({ ping: 1 });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}
run().catch(console.dir);

// upload featured movie
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

// get featured movies
app.get('/featured', async (req, res) => {
  try {
    const movies = await featuredCollection.find().toArray();
    res.json(movies);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch movies' });
  }
});


// top rated movie
app.post('/upload-movie', async (req, res) => {
  const movie = req.body;

  if (!movie || typeof movie !== 'object') {
    return res.status(400).json({ message: 'Invalid movie data' });
  }

  try {
    const result = await client
      .db('moviemasterpro')
      .collection('movies')
      .insertOne(movie);

    res.status(200).json({ message: 'Movie uploaded', id: result.insertedId });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Failed to upload movie' });
  }
});

// get top rated
app.get('/toprated', async (req, res) => {
  try {
    const movies = await client
      .db('moviemasterpro')
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


app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});