//Get the connection to Heroku Database
const db = require('./sql_conn.js');


// Module to run scheduled tasks
var schedule = require('node-schedule');
//express is the framework we're going to use to handle requests
const express = require('express');

const bodyParser = require("body-parser");

var router = express.Router();
router.use(bodyParser.json());


//We use this create the SHA256 hash
const crypto = require("crypto");

const FormData = require("form-data");

let sendGridAPIKey = process.env.EMAIL_API_KEY;

var router = express.Router();
router.use(bodyParser.json());

function sendEmail(from, to, subject, message) {
    var helper = require('sendgrid').mail;
    var from_email = new helper.Email(from);
    var to_email = new helper.Email(to);
    var subject = subject;
    var content = new helper.Content('text/plain', message);
    var mail = new helper.Mail(from_email, subject, to_email, content);
    
    var sg = require('sendgrid')(sendGridAPIKey);
    var request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: mail.toJSON(),
    });
    
    sg.API(request, function(error, response) {
      console.log(response.statusCode);
      console.log(response.body);
      console.log(response.headers);
    });
}

// For testing purposes, print unverified accounts every 1 min.
// var testingScheduler = schedule.scheduleJob('0 * * * * *', function(){
//     console.log('SELECTING unverified accounts every minute.');
//     let command = "SELECT * FROM Members WHERE Verification=0 AND timecreated < NOW() - INTERVAL \'1 day'";
//     db.manyOrNone(command)
//     .then((rows) => {
//         console.log(rows);
//     }).catch((err) => {
//         console.log(err);
//     });
// });

// Clean up unverified accounts that are more than 1 day old.
var cleanUnverifiedAccounts = schedule.scheduleJob('59 59 23 * * *', function(){
    console.log('Cleaning up unverified accounts.');
    let command = "DELETE FROM Members WHERE Verification=0 AND timecreated < NOW() - INTERVAL \'1 day\'";
    db.manyOrNone(command)
    .catch((err) => {
        console.log(err);
    });
});


/**
* Method to get a salted hash.
* We put this in its own method to keep consistency
* @param {string} pw the password to hash
* @param {string} salt the salt to use when hashing
*/
function getHash(pw, salt) {
    return crypto.createHash("sha256").update(pw + salt).digest("hex");
}

function generateVerificationCode() {
    var code = 0;
    while(code < 999 || code > 9999){
        code = Math.ceil(Math.random()*10000);
    }
    return code;
}

module.exports = {
    db, getHash, sendEmail, generateVerificationCode
};