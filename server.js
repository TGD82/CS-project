const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const { ObjectId } = require('mongodb');
const User = require('./models/modeluser');

const app = express();
const port = 3000;

mongoose.connect('mongodb+srv://goplanidhir:Dhir1000@cluster1.cj3xb2t.mongodb.net/loginApp?retryWrites=true&w=majority&appName=Cluster1')
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: true
}));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb+srv://goplanidhir:Dhir1000@cluster1.cj3xb2t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1');
let db;

client.connect().then(() => {
  db = client.db('loginApp');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user && user.password === password) {
    req.session.user = { id: user._id, username: user.username };
    res.sendFile(path.join(__dirname, 'public', 'buy.html'));
  } else {
    res.send('Invalid username or password');
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const existingUser = await User.findOne({ username });

  if (existingUser) return res.send('Username already exists!');

  const newUser = new User({ username, password });
  await newUser.save();

  res.send(`User ${username} registered successfully!`);
});

app.get('/api/user', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  const userData = await db.collection('users').findOne({ username: req.session.user.username });
  const selling = userData?.selling || [];

  res.json({
    username: req.session.user.username,
    bought: userData?.bought || 0,
    sold: userData?.sold || 0,
    selling
  });
});

app.post('/sell', upload.single('image'), async (req, res) => {
  if (!req.file || !req.body.price || !req.body.itemName) {
    return res.status(400).send('Missing fields');
  }

  const imagePath = 'images/' + req.file.filename;
  const price = parseInt(req.body.price);
  const itemName = req.body.itemName;

  const item = { username: req.session.user.username, imagePath, price, itemName };

  await db.collection('items').insertOne(item);

  await db.collection('users').updateOne(
    { username: req.session.user.username },
    { $push: { selling: item }, $setOnInsert: { bought: 0, sold: 0 } },
    { upsert: true }
  );

  res.redirect('/sell.html?success=1');
});

app.delete('/cancel-sell/:itemId', async (req, res) => {
  const itemId = req.params.itemId;
  const username = req.session.user.username;

  await db.collection('items').deleteOne({ _id: new ObjectId(itemId), username });

  await db.collection('users').updateOne(
    { username },
    { $pull: { selling: { _id: new ObjectId(itemId) } } }
  );

  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
