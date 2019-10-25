var mongoose = require('mongoose');
var schema = mongoose.Schema;

var userSchema = new schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contactNum: { type: String, required: true, unique: true },
    gender: { type: String },
    userType: { type: String, required: true },
    active: { type: Boolean, default: false },
    bookingStatus: { type: String }, //pending,booked,cancel
    location: { type: { type: String,default:'Point' }, coordinates: [{ type: Number }] },
});

class User {
    constructor(user) {
        this.name = user.name;
        this.email = user.email;
        this.username = user.username;
        this.password = user.password;
        this.contactNum = user.contactNum;
        this.gender = user.gender || undefined;
        this.userType = user.userType;
        this.active = user.active || undefined;
        this.bookingStatus = user.bookingStatus || undefined;
        this.location = user.location || {type:'Point',coordinates: [0,0]}
    }
}

const userModel = mongoose.model('user', userSchema);
module.exports = { userModel: userModel, User: User };