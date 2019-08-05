var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var amrestSchema = new Schema({}, { strict: false });
var amrestFilesModel = mongoose.model('amrestFile', amrestSchema);
module.exports ={amrestFilesModel:amrestFilesModel,amrestSchema:amrestSchema};