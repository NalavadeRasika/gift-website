const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    customization: {
      text: String,
      font: String,
      message: String,
      giftWrap: Boolean,
      expressDelivery: Boolean,
      color: String,
      photo: String
    }
  }],
  total: Number,
  status: { type: String, default: 'Pending' },
  shippingAddress:{
    fullName:String,
    phone:String,
    address:String,
    city:String,
    state:String,
    postalCode:String,
    country:String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);