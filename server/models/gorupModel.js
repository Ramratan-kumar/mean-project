var mongoose = require('mongoose');
var schema = mongoose.Schema;

var groupSchema = new schema({
    groupId:String,
	groupName:String,
	createdBy:String,
	createdDate:Date,
	userIds:[{type:schema.Types.ObjectId}],
	messages:[{userId:'',dateTime:'',msg:''}],
	groupIcon:{date:Date,changedBy:schema.Types.ObjectId,img:String},
});

const groupModel = mongoose.model('groupDetails', groupSchema);
module.exports = groupModel;