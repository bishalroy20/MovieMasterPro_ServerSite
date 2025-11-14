const express = require('express');
const cors = require('cors');
const { MongoClient,ObjectId , ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());


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




// ✅ Get movies with optional filters (regex for genres)
app.get('/movies', async (req, res) => {
  try {
    const { genres, minRating, maxRating } = req.query;
    const filter = {};

    // Genre filter using regex
    if (genres) {
      const genreArray = genres.split(',').map(g => g.trim());
      filter.$or = genreArray.map(g => ({
        genre: { $regex: new RegExp(g, 'i') } // case-insensitive match
      }));
    }

    // Rating filter using $gte and $lte
    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = parseFloat(minRating);
      if (maxRating) filter.rating.$lte = parseFloat(maxRating);
    }

    const movies = await db.collection('movies').find(filter).toArray();
    res.status(200).json(movies);
  } catch (err) {
    console.error('Fetch error (/movies):', err);
    res.status(500).json({ message: 'Failed to fetch movies' });
  }
});




 // ✅ Get top-rated movies
app.get("/movies/top-rated", async (req, res) => {
  try {
    const movies = await db
      .collection("movies")
      .find({ rating: { $exists: true } })  // only movies with rating
      .sort({ rating: -1 })                 // highest rating first
      .limit(5)
      .toArray();

    res.json(movies);
  } catch (err) {
    console.error("Failed to fetch top rated movies:", err);
    res.status(500).json({ message: "Failed to fetch top rated movies" });
  }
});

// recently added
app.get('/movies/recent', async (req, res) => {
  try {
    const movies = await db
      .collection('movies')
      .find({})
      .sort({ _id: -1 }) // newest first
      .limit(6)
      .toArray();
    res.json(movies);
  } catch (err) {
    console.error('Failed to fetch recent movies:', err);
    res.status(500).json({ message: 'Failed to fetch recent movies' });
  }
});



// Total movies
app.get("/stats/movies", async (req, res) => {
  try {
    const totalMovies = await db.collection("movies").countDocuments();
    res.json({ totalMovies });
  } catch (err) {
    console.error("Failed to fetch total movies:", err);
    res.status(500).json({ message: "Failed to fetch total movies" });
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


// featured movies in hero section
app.get("/featured-movies", async (req, res) => {
  try {
    const movies = await db.collection("featuredMovies").find().toArray();
    res.json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch featured movies" });
  }
});


// movie details
app.get("/movies/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid movie ID" });
  }

  try {
    const movie = await db.collection("movies").findOne({ _id: new ObjectId(id) });
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json(movie);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch movie" });
  }
});


// Total users who added movies
app.get("/stats/users", async (req, res) => {
  try {
    const users = await db
      .collection("movies")
      .distinct("addedBy", { addedBy: { $exists: true, $ne: null, $ne: "" } }); // only valid emails
    res.json({ totalUsers: users.length });
  } catch (err) {
    console.error("Failed to fetch total users:", err);
    res.status(500).json({ message: "Failed to fetch total users" });
  }
});






// Watchlist codes
function watchlistCollection() {
  return client.db("moviemasterpro").collection("watchlists");
}


app.post("/watchlist/add", async (req, res) => {
  try {
    const { email, movieId, movie } = req.body;
    if (!email || !movieId || !movie) {
      return res.status(400).json({ message: "email, movieId and movie are required" });
    }

    const col = watchlistCollection();

    const exists = await col.findOne({ email, movieId });
    if (exists) {
      return res.status(400).json({ message: "Already in watchlist" });
    }

    const doc = { email, movieId, movie, createdAt: new Date() };
    const result = await col.insertOne(doc);

    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    console.error("watchlist add error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/watchlist", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ message: "email query param required" });

    const col = watchlistCollection();
    const list = await col.find({ email }).sort({ createdAt: -1 }).toArray();

    res.json(list);
  } catch (err) {
    console.error("watchlist get error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/watchlist/check", async (req, res) => {
  try {
    const { email, movieId } = req.query;
    if (!email || !movieId) return res.status(400).json({ message: "email and movieId required" });

    const col = watchlistCollection();
    const item = await col.findOne({ email, movieId });

    res.json({ exists: !!item, item: item || null });
  } catch (err) {
    console.error("watchlist check error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.delete("/watchlist/remove/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const col = watchlistCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) return res.status(404).json({ message: "Not found" });

    res.json({ message: "Removed from watchlist" });
  } catch (err) {
    console.error("watchlist remove error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
