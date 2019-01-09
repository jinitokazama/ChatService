const express = require('express');

const bodyParser = require("body-parser");

const crypto = require("crypto");

let db = require('../utilities/utils').db;

let getHash = require('../utilities/utils').getHash;

let sendEmail = require('../utilities/utils').sendEmail;

let generateVerificationCode = require('../utilities/utils').generateVerificationCode;

var router = express.Router();
router.use(bodyParser.json());

router.post('/resetAttempt', (req, res) => {
    res.type("application/json");
    var email = req.body['email'];

    //Confirm that it is in email address form - should still fix this to only check for @
    var pattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/; 
    if(!pattern.test(email)){
        email = false;
    }

    if(email) {
        //Using the 'one' method means that only one row should be returned
        db.one("SELECT * FROM Members WHERE  email=$1 AND Verification=1", [email])
        //If successful, run function passed into .then()
        .then(() => {
            // Call for email here
            let code = generateVerificationCode();
            db.none("UPDATE Members SET VerificationCode=$2 WHERE Email=$1 AND Verification=1", [email, code])
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
            sendEmail("No-reply@chat", email, "Reset your password", "<strong> A password reset attempt has been made, please use this code to reset: " + code + ". </strong>");
        })
        //More than one row shouldn't be found
        .catch((err) => {
            //If anything happened, it wasn't successful
            res.send({
                success: false,
                message: 'Either the account does not exist or has not been verified.'
            });
        });
    } else {
        res.send({
            success: false,
            message: "Resend failed. Make sure email is correct."
        });
    }
});

router.post('/resetSubmit', (req, res) => {
    res.type("application/json");
    var password = req.body['password'];
    var email = req.body['email'];
    var code = req.body['username'];
    if(password && email && code) {

        let salt = crypto.randomBytes(32).toString("hex");
        let salted_hash = getHash(password, salt);

        let params = [salted_hash, email, code, salt];
        //Using the 'one' method means that only one row should be returned
        db.one('SELECT * FROM Members WHERE email=$2 AND VerificationCode=$3', params)
        //If successful, run function passed into .then()
        .then(() => {
            db.none('UPDATE Members SET Password=$1, Salt=$4 WHERE email=$2 AND VerificationCode=$3', params)
            .then(() => {
                res.send({
                    success: true,
                    message: 'Your password has been reset.'
                });
            }).catch((err) => {
                res.send({
                    success: false,
                    message: 'Encountered problem when trying to update password.'
                });
            });
        })
        //More than one row shouldn't be found, since table has constraint on it
        .catch((err) => {
            //If anything happened, it wasn't successful
            res.send({
                success: false,
                message: 'Verification code is incorrect.'
            });
        });
    } else {
        res.send({
            success: false,
            message: "Credentials incorrect"
        });
    }
});

module.exports = router;