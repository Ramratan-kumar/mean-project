var mongoose = require('mongoose');
var schema = mongoose.Schema;

var userSchema = new schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contactNum: { type: String, required: true, unique: true },
    gender: { type: String },
    userType: { type: String,required:true },
    active: { type: Boolean, default: false },
    bookingStatus: { type: String }, //pending,booked,cancle
     location: { type: {type:String} , coordinates: [String] },
});

const userModel = mongoose.model('user', userSchema);
module.exports = userModel;