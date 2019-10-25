var express = require('express');
var router = express.Router();
var middleWare = require('../services/middleware');
var userController = require('../controller/userController');
/* GET users listing. */
router.get('/details', middleWare.verifyToken, userController.getUserDetails);
router.post('/register', userController.registerUser);
router.post('/login', userController.login);
router.post('/logout', middleWare.verifyToken, userController.logout);


module.exports = router;
