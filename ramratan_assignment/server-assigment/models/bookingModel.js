var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bookingSchema = new Schema({
    pickupLocation: { latitude: Number, longitude: Number },
    driverId:{type:Schema.Types.ObjectId,ref:"user"},
    userId:{type:Schema.Types.ObjectId,ref:"user"},
    dateTime:{type:Date},
    dropLocation:{ type: String},
    status:{type:String}
});

const bookingModel = mongoose.model('booking', bookingSchema);
module.exports = bookingModel;