let jwt = require('jsonwebtoken');
let config = require('../config');
var userModel = require('../models/userModel').userModel;

module.exports = {
  verifyToken: verifyToken
}

function verifyToken(req, res, next) {
  let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
  if (token && token.startsWith('Bearer ')) {
    // Remove Bearer from string
    token = token.slice(7, token.length);
  }

  if (token) {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid'
        });
      } else {
        req.user = decoded;
        userModel.findOne({ _id: req.user._id }, (err, result) => {
          if (err) {
            return res.status(400).json({ success: false, message: err });
          } else if (result) {
            next();
          } else {
            return res.status(401).json({
              success: false,
              message: 'Token is not valid'
            });
          }
        });

      }
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Auth token is not supplied'
    });
  }
};