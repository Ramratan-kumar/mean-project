var mongoose = require('mongoose');
var schema = mongoose.Schema;

var bookingSchema = new schema({
    location: { latitued: String, longitude: String },
    driverId:{type:Schema.Types.ObjectId,ref:"user"},
    userId:{type:Schema.Types.ObjectId,ref:"user"},
    dateTime:{type:Date}
});

const bookingModel = mongoose.model('booking', bookingSchema);
module.exports = bookingModel;