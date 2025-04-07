const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  username: String,
  imagePath: String,
  price: Number
});

module.exports = mongoose.model('Item', itemSchema);
