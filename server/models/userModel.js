var mongoose = require('mongoose');
var schema = mongoose.Schema;

var userSchema = new schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contactNum: { type: String, required: true, unique: true },
    gender: { type: String }
});

const userModel = mongoose.model('user', userSchema);
module.exports = userModel;