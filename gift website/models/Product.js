const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  category: String,
  stock: { type: Number, default: 0 },
  customization: {
    allowText: { type: Boolean, default: false },
    allowPhoto: { type: Boolean, default: false },
    allowColor: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);