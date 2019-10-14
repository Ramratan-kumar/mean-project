var mongoose = require('mongoose');
var userModel = require('../models/userModel');
var passwordHash = require('password-hash');
var fs = require('fs');
const jwt = require('jsonwebtoken');
let config = require('../config');
var events = require('events');
var eventEmitter = new events();
const mailService = require('../services/mailService');
module.exports = {
    registerUser: registerUser,
    getUserDetails: getUserDetails,
    login: login,
    updateUser:updateUser
}

//eventEmitter.emit('sendMail',{});
async function registerUser(req, res) {
    try {
        req.body.password = passwordHash.generate(req.body.password);
        req.body.username = req.body.email.split('@')[0];
        existingUser = await userModel.findOne({
            $or: [{ email: req.body.email },
            { username: req.body.username },
            { contactNum: req.body.contactNum }]
        }, { email: 1, username: 1, contactNum: 1 });

        if (existingUser && existingUser.email === req.body.email) {
            return res.status(206).json({ message: "Email already exists." });
        } else if (existingUser && existingUser.username === req.body.username) {
            return res.status(206).json({ message: "User Name already exists." });
        } else if (existingUser && existingUser.contactNum === req.body.contactNum) {
            return res.status(206).json({ message: "Contact number already exists." });
        } else {
            user = new userModel(req.body);
            await user.save();
            mailService.sendMail({
                recipientEmail: req.body.email,
                subject: 'Registered',
                message: '<b> Registration success <b>'
            });
            res.status(200).json({ message: "User created successfully" });
        }

    } catch (err) {
        console.error(err);
        res.status(400).send("Some thing went wrong.");
    }
}

async function login(req, res) {
    try {
        userName = req.body.username.toLowerCase();
        user = await userModel.findOne({

            $or: [{ email: userName },
            { username: userName },
            { contactNum: userName }]
        }, { password: 1 }

        );
        if (user && passwordHash.verify(req.body.password, user.password)) {
            let token = jwt.sign({
                username: user._doc.username,
                email: user._doc.email,
                id: user._doc._id
            },
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
        let user = await userModel.findOne({ _id: req.user.id });
        user._doc.password = undefined;
        res.status(200).send(user);
    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
}

async function updateUser(req,res){
    try{
        let updatedUser = await userModel.updateOne({_id:req.body.userId},{$set:{gender:req.body.gender}});
        if(updatedUser.n>0){
            res.status(200).send({message:'Updated success.'})
        }else{
            res.status(204).send({message:'Data not found'});
        }
    }catch(err){
        res.status(400).send('Some thing went wrong');
    }
}