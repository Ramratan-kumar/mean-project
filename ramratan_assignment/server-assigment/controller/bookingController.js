var mongoose = require('mongoose');
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
        if (req.user.type === 'user') {
            let availableAuto = await updateBookingStatus(req, 'pending');
            if (availableAuto) {
                res.status(200).send({ message: 'Pending' });
            } else {
                res.status(404).send('Not Found');
            }
        } else {
            res.status(304).send({ message: 'Auto driver' });
        }
    } catch (err) {
        console.error(err);
        res.status(400).send("Some thing went wrong");
    }
}

async function updateBookingStatus(req, status) {
    try {
        let statusList = [];
        if (status === 'pending') {
            statusList = ["pending", "booked"]
        }else if(status === 'complete'){
            statusList = ['pending'];
        } else {
            statusList = ['booked']
        }
        let updateObj = { bookingStatus: status };
        if (req.user.type === 'user') {
            updateObj.bookedFor = req.user._id;
            updateObj.dropLocation = req.body.dropLocation;
            updateObj.pickupLocation = {latitude:req.body.latitude, longitude: req.body.longitude};
        }
        let availableAuto = await userModel.findOneAndUpdate(
            {
                userType: 'driver', active: true, bookingStatus: { $nin: statusList },
                location: {
                    $near:
                    {
                        $geometry: { type: "Point", coordinates: [req.body.latitude, req.body.longitude] },
                        $maxDistance: 5000
                    }
                }
            },
            { $set: updateObj }, { new: true });
        return availableAuto;
    } catch (err) {
        throw err;
    }
}
async function getNearByAuto(req, res) {
    try {
        let nearByAuto = {};
        if (req.user.type === 'user') {
             nearByAuto = await userModel.find({
                userType: 'driver', active: true,
                location: {
                    $near:
                    {
                        $geometry: { type: "Point", coordinates: [+req.params.latitude, +req.params.longitude] },
                        $maxDistance: 5000
                    }
                },
                bookingStatus: { $nin: ["pending", "booked"] }
            },{name:1,location:1});
        }

        res.status(200).send(nearByAuto);
    } catch (err) {
        res.status(400).send('Some thing went wrong.');
    }
}

async function getBookingDetails(req, res) {
    try {
        let bookingDetails = await bookingModel.aggregate(
            [{
                $match: {
                    $or: [
                        { userId: mongoose.Types.ObjectId(req.user._id) },
                        { driverId: mongoose.Types.ObjectId(req.user._id) }]
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userId", driverId: "$driverId" },
                    pipeline: [
                        {
                            $match: { $expr: { $and: [{ $eq: ["$_id", "$$driverId"] }] } }
                        }

                    ], as: "userDetails"
                }
            }, { $unwind: "$userDetails" }, { $project: { dateTime: 1, pickupLocation: 1, dropLocation:1, userDetails: { name: 1 } } }]);
        res.status(200).send(bookingDetails);
    } catch (err) {
        console.error(err);
        res.status(400).send('Some thing went wrong');
    }
}

async function changeBooking(req, res) {
    try {
        let availableAuto = await updateBookingStatus(req, req.body.status);
        if (req.body.status === 'booked' && availableAuto) {
            let newBookingObj = {
                driverId: availableAuto._id, userId: availableAuto.bookedFor, dateTime: new Date(),
                pickupLocation: { latitude: availableAuto.pickupLocation.latitude, longitude: availableAuto.pickupLocation.longitude },
                dropLocation: availableAuto.dropLocation
            };
            await bookingModel.create(newBookingObj);
        }
        res.status(200).send({ message: req.body.status });
    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
}


