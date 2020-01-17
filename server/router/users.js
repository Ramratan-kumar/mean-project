var express = require('express');
var router = express.Router();
var middleWare = require('../services/middleware');
var userController = require('../controller/userController');
/* GET users listing. */
router.get('/details', middleWare.verifyToken, userController.getUserDetails);
router.post('/register', userController.registerUser);
router.post('/login', userController.login);
router.put('/update-gender', middleWare.verifyToken, userController.updateUser);

router.get('/download', function (req, res) {
    const { parse } = require('json2csv');

    const fields = ['field1', 'field2', 'field3'];
    const opts = { fields };
    const myData = [{'field1':1,'field2':2,'field3':3}]
    try {
        const csv = parse(myData, opts);
        console.log(csv);
        res.send(csv);
    } catch (err) {
        console.error(err);
    }
})

module.exports = router;
