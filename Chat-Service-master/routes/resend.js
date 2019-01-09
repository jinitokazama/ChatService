//express is the framework we're going to use to handle requests
const express = require('express');

const bodyParser = require("body-parser");

let sendEmail = require('../utilities/utils').sendEmail;

let generateVerificationCode = require('../utilities/utils').generateVerificationCode;

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

var router = express.Router();
router.use(bodyParser.json());

router.post('/', (req, res) => {
    res.type("application/json");
    var username = req.body['username'];
    var email = req.body['email'];
    if(username && email) {
        //Using the 'one' method means that only one row should be returned
        db.one("SELECT * FROM Members WHERE username=$1 AND email=$2 AND Verification=0", [username, email])
        //If successful, run function passed into .then()
        .then(() => {
            // Call for email here
            let code = generateVerificationCode();
            db.none("UPDATE Members SET VerificationCode=$3 WHERE Username=$1 AND Email=$2 AND Verification=0", [username, email, code])
            .then(() => { 
                res.send({
                    success: true,
                    message: "A new code has been sent to " + email + "."
                });
            }).catch((err) => {
                res.send({
                    success: false,
                    error: req.body,
                    message: "Problem occured when trying to generate new code for this account."
                });
            });
            sendEmail("No-reply@chat", email, "Welcome!", "<strong> Welcome to our app!. Please confirm your account by entering your verification code: " + code + ". </strong>");
        })
        //More than one row shouldn't be found
        .catch((err) => {
            //If anything happened, it wasn't successful
            res.send({
                success: false,
                message: 'Either the account does not exist or has already been verified.'
            });
        });
    } else {
        res.send({
            success: false,
            message: "Resend failed. Make sure email and username are correct."
        });
    }
});

module.exports = router;