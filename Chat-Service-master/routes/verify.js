//express is the framework we're going to use to handle requests
const express = require('express');

const bodyParser = require("body-parser");

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

var router = express.Router();
router.use(bodyParser.json());

router.post("/", (req, res) => {
    res.type("application/json");
    var username = req.body['username'];
    var email = req.body['email'];
    var code = req.body['code'];
    if(username && email && code) {
        let params = [username, email, code];

        //Using the 'one' method means that only one row should be returned
        db.one('SELECT VerificationCode FROM Members WHERE username=$1 AND email=$2 AND VerificationCode=$3', params)
        //If successful, run function passed into .then()
        .then(() => {
            db.none('UPDATE Members SET Verification=1 WHERE username=$1 AND email=$2 AND VerificationCode=$3', params)
            .then(() => {
                res.send({
                    success: true,
                    message: 'Your account is now verified.'
                });
            }).catch((err) => {
                res.send({
                    success: false,
                    message: 'Encountered problem when trying to update verification.'
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