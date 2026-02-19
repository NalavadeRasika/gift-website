

const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code:{
    type:String,
    required:true,
    unique:true,
    uppercase:true
  },
  discount:{
    type:Number,
    required:true
  },
  type:{
    type:String,
    enum:["percent","fixed"],
    default:"percent"
  },
  minOrder:{
    type:Number,
    default:0
  },
  expiry:{
    type:Date,
    required:true
  },
  usageLimit:{
    type:Number,
    default:1
  },
  usedCount:{
    type:Number,
    default:0
  },
  active:{
    type:Boolean,
    default:true
  }
},{timestamps:true});

module.exports = mongoose.model("Coupon",couponSchema);
