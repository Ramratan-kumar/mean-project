var mongoose = require('mongoose');
var userModel = require('../models/userModel');
var passwordHash = require('password-hash');
var fs = require('fs');
var path = "D:/project/FileIngester/";

module.exports = {
    registerUser: registerUser,
    getUserDetails: getUserDetails
}

async function registerUser(req, res) {
    try {
        req.body.password = passwordHash.generate(req.body.password);
        user = new userModel(req.body);
        await user.save();
        res.send(user);

    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
}

async function getUserDetails(req, res) {
    try {
        res.send({ message: "Success" });
    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
}

