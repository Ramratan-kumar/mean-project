var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bookingSchema = new Schema({
    location: { latitude: Number, longitude: Number },
    driverId:{type:Schema.Types.ObjectId,ref:"user"},
    userId:{type:Schema.Types.ObjectId,ref:"user"},
    dateTime:{type:Date}
});

const bookingModel = mongoose.model('booking', bookingSchema);
module.exports = bookingModel;