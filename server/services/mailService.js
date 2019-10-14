'use strict';
const nodemailer = require('nodemailer');
var events = require('events');
var eventEmitter = new events();
async function sendMail(mailObj) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing


    // create reusable transporter object using the default SMTP transport
    // this transport will not deliver mail to recipient
    let transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'dee.heaney50@ethereal.email', // generated ethereal user
            pass: 'pZnnNRxqdPqCqfru9N' // generated ethereal password
        }
    });

    //for gmail service 
    // let transporter = nodemailer.createTransport({
    //     service: 'gmail',
    //     auth: {
    //            user: '************@gmail.com',
    //            pass: '*******'
    //        }
    // });
    // use the given link for allow secur app https://myaccount.google.com/lesssecureapps?pli=1
    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: 'ramratankumar11@gmail.com', // sender address
        to: mailObj.recipientEmail, // list of receivers
        subject: mailObj.subject, // Subject line
        html: mailObj.message // html body
    });
    console.log('Message sent: %s', info.messageId);
}

module.exports = { sendMail: sendMail }
//eventEmitter.on('sendMail',);