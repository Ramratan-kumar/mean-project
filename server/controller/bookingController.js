
var userModel = require('../models/userModel').userModel;
var bookingModel = require('../models/bookingModel');
var passwordHash = require('password-hash');
const jwt = require('jsonwebtoken');
let config = require('../config');


module.exports = {
    bookAuto: bookAuto,
    getBookingDetails: getBookingDetails,
    getNearByAuto: getNearByAuto,
    changeBooking: changeBooking
}


async function bookAuto(req, res) {
    try {
        if (req.user.userType === 'user') {
            let availableAuto = await updateBookingStatus(req, 'pending');
            if (availableAuto) {
                res.status(200).send({ message: 'Pending' });
            } else {
                res.status(404).send('Not Found');
            }
        }else{
            res.status(304).send({message:'Auto driver'});
        }


    } catch (err) {
        console.error(err);
        res.status(400).send("Some thing went wrong");
    }
}

async function updateBookingStatus(req, status) {
    try {
        console.log("---------",req.body);
        let availableAuto = await userModel.findOneAndUpdate(
            {
                userType: 'driver', active: true, bookingStatus: { $nin: ["pending", "booked"] },
                location: {
                    $near:
                    {
                        $geometry: { type: "Point", coordinates: [req.body.latitude, req.body.longitude] },
                        $maxDistance: 5000
                    }
                }
            },
            { $set: { bookingStatus: status } });
        return availableAuto;
    } catch (err) {
        throw err;
    }
}
async function getNearByAuto(req, res) {
    try {

        let nearByAuto = await userModel.find({
            userType: 'driver', active: true,
            location: {
                $near:
                {
                    $geometry: { type: "Point", coordinates: [+req.params.latitude, +req.params.longitude] },
                    $maxDistance: 5000
                }
            },
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

async function changeBooking(req, res) {
    try {
        let availableAuto = await updateBookingStatus(req, req.body.status);
        console.log(availableAuto);
        if (req.body.status === 'booked' && availableAuto) {
            let newBookingObj = {
                driverId: availableAuto._id, userId: req.user._id, dateTime: new Date(),
                location: {latitude:req.body.latitude,longitude:req.body.longitude}
            };
            await bookingModel.insert(newBookingObj);
        }
        res.status(200).send({ message: req.body.status });
    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
}


