var express = require('express');
var router = express.Router();
var middleWare = require('../services/middleware');
var userController = require('../controller/userController');
/* GET users listing. */
router.get('/',middleWare.verifyToken, userController.getUserDetails);
router.post('/create', userController.registerUser);
router.post('/login', userController.login);

module.exports = router;
