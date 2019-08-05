var express = require('express');
var router = express.Router();

var userController = require('../controller/userController');
/* GET users listing. */
router.get('/', userController.getUserDetails);
router.post('/create', userController.registerUser);

module.exports = router;
