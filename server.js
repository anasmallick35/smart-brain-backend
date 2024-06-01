const express = require("express");
const bcrypt = require('bcrypt');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

//connected with mongodb with database name face-recog and collection name is users in mongodb atlas

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  joined: { type: Date, default: Date.now },
  entries: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.send('success');
});

app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(401).json({ message: 'All fields are mandatory' });
  }
  try {
    const user = await User.findOne({ email });
    if (user && bcrypt.compareSync(password, user.password)) {
      return res.status(200).json({ id: user._id, name: user.name, email: user.email, entries: user.entries });
    } else {
      return res.status(400).json({ message: 'User and password are not valid' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  try {
    const newUser = new User({
      name,
      email,
      password: hash
    });
    const savedUser = await newUser.save();
    res.status(201).json({ id: savedUser._id, name: savedUser.name, email: savedUser.email, entries: savedUser.entries });
  } catch (err) {
    res.status(400).json('Unable to register');
  }
});

app.get('/profile/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json("User not found");
    }
  } catch (err) {
    res.status(500).json("Error getting user");
  }
});

app.put('/image', async (req, res) => {
  const { id } = req.body;
  try {
    const user = await User.findById(id);
    if (user) {
      user.entries += 1;
      const updatedUser = await user.save();
      res.json(updatedUser.entries);
    } else {
      res.status(404).json("User not found");
    }
  } catch (err) {
    res.status(500).json("Unable to get entries");
  }
});

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
