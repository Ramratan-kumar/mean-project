
var userModel = require('../models/userModel');
var bookingModel = require('../models/bookingModel');
var passwordHash = require('password-hash');
const jwt = require('jsonwebtoken');
let config = require('../config');


module.exports = {
    registerUser: registerUser,
    getUserDetails: getUserDetails,
    login: login,
    logout: logout
    
}

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
            res.status(200).json({ message: "User created successfully" });
        }

    } catch (err) {
        console.error(err);
        res.status(400).send("Some thing went wrong.");
    }
}

function createToken(user) {
    let token = jwt.sign({
        username: user.username,
        email: user.email,
        _id: user._id,
        type:user.userType
    },
        config.secret,
        {
            expiresIn: '1h' // expires in 24 hours
        }
    );
    return token;

}
async function login(req, res) {
    try {
        userName = req.body.username.toLowerCase();
        user = await userModel.findOne({

            $or: [{ email: userName },
            { username: userName },
            { contactNum: userName }]
        }, { password: 1, userType:1 }

        );
        if (user && passwordHash.verify(req.body.password, user.password)) {
            token = createToken(user._doc);
            res.setHeader('token', token);
            res.setHeader('Access-Control-Expose-Headers', 'token');
            if(user._doc.userType==='driver'){
                await updateUser(user._doc,req.body.location);
            }
            res.status(200).send({ message: "Authenticated" });
        } else {
            res.status(401).json({ message: "Password or username incorrect." })
        }
    } catch (err) {
        res.status(400).send("Some thing went wrong.");
    }

}

async function updateUser(userData,location) {
    try {
        await userModel.updateOne({ _id: userData._id }, { active: true, location: location });
    } catch (err) {
        throw err;
    }
}



async function logout(req, res) {
    try {
        updated = await userModel.findOne({ _id: req.user._id }, { active: false });
        if (updated.n > 0) {
            res.status(200).send({ message: 'logout success' });
        } else {
            res.status(401).send('Not found');
        }

    } catch (err) {
        res.status(400).send('Some thing went wrong');
    }
}

async function getUserDetails(req, res) {
    try {
        let user = await userModel.findOne({ _id: req.user._id },{password:0});
        res.status(200).send(user);
    } catch (err) {
        res.status(400).send(err);
    }
}

