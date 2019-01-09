//express is the framework we're going to use to handle requests
const express = require('express');
//Create a new instance of express
const app = express();

const bodyParser = require("body-parser");

//We use this create the SHA256 hash
const crypto = require("crypto");

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

let getHash = require('../utilities/utils').getHash;

let sendEmail = require('../utilities/utils').sendEmail;

let generateVerificationCode = require('../utilities/utils').generateVerificationCode;

var router = express.Router();
router.use(bodyParser.json());

router.post("/", (req, res) => {
    res.type("application/json");
    //Retrieve data from query params
    var first = req.body['first'];
    var last = req.body['last'];
    var username = req.body['username'];
    var email = req.body['email'];
    var password = req.body['password'];
    if(first && last && username && email && password) {
        var good = true;
        var pattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/; 
        if(!pattern.test(email)){
            good = false;
        }
        if(username.length < 3){
            good = false;
        }

        if(!good){
            res.send({
                success: false,
                input: req.body
                //error: "Incorrect user information"
            });
        }
        
        //We're storing salted hashes to make our application more secure.
        //If you're interested as to what that is, and why we should use it
        //watch this youtube video: https://www.youtube.com/watch?v=8ZtInClXe1Q
        let salt = crypto.randomBytes(32).toString("hex");
        let salted_hash = getHash(password, salt);
        let code = generateVerificationCode();

        //Use .none() since no result gets returned from an INSERT in SQL
        //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        //If you want to read more: https://stackoverflow.com/a/8265319

        let precheck = 'DELETE FROM Members WHERE (username=$1 OR email=$2) AND Verification=0'
        db.manyOrNone(precheck, [username, email])
        .catch((err) => {
            res.send({
                success: false,
                message: 'Problem occured when checking and deleting unverified account(s) with same username.',
                error: err
            });
        });

        let params = [first, last, username, email, salted_hash, salt, code];
        db.none("INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt, VerificationCode) VALUES ($1, $2, $3, $4, $5, $6, $7)", params)
        .then(() => {
            //We successfully added the user, let the user know
            res.send({
                success: true,
                message: 'Please check your email for verification code'
            });
            sendEmail("No-reply@chat", email, "Welcome!", "Welcome to our app!. Please confirm your account by entering your verification code: " + code + ".");
        }).catch((err) => {
            // Here we should check if the user is registered but not verified and
            // if so replace the old entry with the new one and send a new verification code
            //log the error
            //console.log(err);
             //If we get an error, it most likely means the account already exists
            //Therefore, let the requester know they tried to create an account that already exists
            res.send({
                success: false,
                error: err
            });
        });
    } else {
        res.send({
            success: false,
            input: req.body,
            error: "Missing required user information"
        });
    }
});

module.exports = router;