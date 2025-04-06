const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const User = require('./modeluser');

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

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.send('Username already exists!');
    }

    const newUser = new User({ username, password });
    await newUser.save();

    res.send(`User ${username} registered successfully!`);
  } catch (error) {
    console.error(error);
    res.send('Error registering user');
  }
});

app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json({ username: req.session.user.username });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
