
var userModel = require('../models/userModel');
var bookingModel = require('../models/bookingModel');
var passwordHash = require('password-hash');
const jwt = require('jsonwebtoken');
let config = require('../config');


module.exports = {
    bookAuto: bookAuto,
    getBookingDetails: getBookingDetails,
    getNearByAuto:getNearByAuto
}


async function bookAuto(req, res) {
    try {
        let availableAuto = await userModel.findOneAndUpdate(
            { userType: 'driver', active: true, location: { $near: [req.body.latitue, req.body.longitute] } },
            { $set: { booked: true } });
        let newBookingObj = { driverId: availableAuto._id, userId: req.user._id, dateTime: new Date(), location: req.body };
        await bookingModel.insert({ newBookingObj });
        res.status(200).send(availableAuto);
    } catch (err) {
        res.status(400).send("Some thing went wrong");
    }
}

async function getNearByAuto(req, res) {
    try {
        let nearByAuto = await userModel.find({
            userType: 'driver', active: true,
            location: { $near: [+req.params.latitude, +req.params.longitude] },
            bookingStatus: { $nin: ["pending", "booked"] }
        });
        res.status(200).send(nearByAuto);
    } catch (err) {
        res.status(400).send('Some thing went wrong.');
    }
}

async function getBookingDetails(req, res) {
    try {
        let bookingDetails = await bookingModel.aggregate({ $match: { $or: [{ userId: req.user._id }, { driverId: req.user._id }] } },
            {
                $lookup: {
                    from: "user",
                    let: { userId: "$userId", driverId: "$driverId" },
                    pipeline: [
                        {
                            $match:
                            {

                                $expr:
                                {
                                    $or:
                                        [
                                            { $eq: ["$_id", "$$userId"] },
                                            { $eq: ["$_id", "$$driverId"] }
                                        ]
                                }
                            }
                        }

                    ], as: "userDetails"
                }
            });
        res.status(200).send(bookingDetails);
    } catch (err) {
        res.status(400).send('Some thing went wrong');
    }
}



