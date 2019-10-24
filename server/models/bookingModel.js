var mongoose = require('mongoose');
var schema = mongoose.Schema;

var bookingSchema = new schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contactNum: { type: String, required: true, unique: true },
    gender: { type: String },
    userType: { type: String },
    active: { type: Boolean, default: false },
    booked: { type: Boolean, default: false },
    location: { latitued: String, longitude: String }
});

const bookingModel = mongoose.model('booking', bookingSchema);
module.exports = bookingModel;