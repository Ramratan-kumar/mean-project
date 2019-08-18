var mongoose = require('mongoose');
var userModel = require('../models/userModel');
var passwordHash = require('password-hash');
var fs = require('fs');
var path = "D:/project/FileIngester/";
const jwt = require('jsonwebtoken');
let config = require('../config');

module.exports = {
    registerUser: registerUser,
    getUserDetails: getUserDetails,
    login: login
}

async function registerUser(req, res) {
    try {
        req.body.password = passwordHash.generate(req.body.password);
        existingUser = await userModel.findOne({
            $or: [{ email: req.body.email },
            { username: req.body.username }]
        }, { email: 1, username: 1 });

        if (existingUser && existingUser.email === req.body.email) {
            return res.status(206).json({ message: "Email all ready exists." })
        } else if (existingUser && existingUser.username === req.body.username) {
            return res.status(206).json({ message: "User Name all ready exists." })
        } else {
            user = new userModel(req.body);
            await user.save();
            res.status(200).json({ message: "User created successfully" });
        }

    } catch (err) {
        console.error(err);
        res.status(400).send(err);
    }
}

async function login(req, res) {
    try {
        userEmail = req.body.email ? req.body.email.toLowerCase() : req.body.username.toLowerCase();
        user = await userModel.findOne({

            $or: [{ email: userEmail },
            { username: userEmail }]
        }, { password: 1 }

        );
        if (user && passwordHash.verify(req.body.password, user.password)) {
            let token = jwt.sign({ username: userEmail },
                config.secret,
                {
                    expiresIn: '1h' // expires in 24 hours
                }
            );
            res.setHeader('token', token);
            res.setHeader('Access-Control-Expose-Headers', 'token');
            res.status(200).send({ message: "Authenticated" });
        } else {
            res.status(401).json({ message: "Password or username incorrect." })
        }
    } catch (err) {
        res.status(400).send("Some thing went wrong.");
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

async function getLogedInUserDetails(req, res) {
try{
    
}catch(err){

}
}

