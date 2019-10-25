var express = require('express');
var router = express.Router();
var middleWare = require('../services/middleware');
var bookingController = require('../controller/bookingController')
/* GET users listing. */
router.post('/auto',middleWare.verifyToken,bookingController.bookAuto);
router.get('/details',middleWare.verifyToken,bookingController.getBookingDetails);
router.get('/nearbyauto/:latitude/:longitude',middleWare.verifyToken,bookingController.getNearByAuto);

module.exports = router;
