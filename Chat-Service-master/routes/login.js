//express is the framework we're going to use to handle requests
const express = require('express');

const FormData = require("form-data");

const bodyParser = require("body-parser");

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

let getHash = require('../utilities/utils').getHash;

var router = express.Router();
router.use(bodyParser.json());

//app.get('/users') means accept http 'GET' requests at path '/users'
router.post('/', (req, res) => {
    let username = req.body['username'];
    let theirPw = req.body['password'];
    let wasSuccessful = false;
    if(username && theirPw) {
        //Using the 'one' method means that only one row should be returned
        db.one('SELECT Password, Salt FROM Members WHERE Username=$1 AND Verification=1', [username])
        //If successful, run function passed into .then()
        .then(row => {
            let salt = row['salt'];
            let ourSaltedHash = row['password']; //Retrieve our copy of the password
            let theirSaltedHash = getHash(theirPw, salt); //Combined their password with our salt, then hash
            let wasCorrectPw = ourSaltedHash === theirSaltedHash; //Did our salted hash match their salted hash?
            //Send whether they had the correct password or not
            res.send({
                success: wasCorrectPw
            });
        })
        //More than one row shouldn't be found, since table has constraint on it
        .catch((err) => {
            //If anything happened, it wasn't successful
            res.send({
                success: false,
                message: err
            });
        });
    } else {
        res.send({
            success: false,
            message: 'missing credentials'
        });
    }
});

module.exports = router;