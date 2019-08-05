var mongoose = require('mongoose');
var schema = mongoose.Schema;

var userSchema = new schema({
    name: { type: String, require: true },
    email: { type: String, require: true, unique: true },
    username: { type: String, require: true, unique: true },
    password: { type: String, require: true }
});

const userModel = mongoose.model('user', userSchema);
module.exports = userModel;