//express is the framework we're going to use to handle requests
const express = require('express');
//Create a new instance of express
const app = express();
//Create connection to Heroku Database
let db = require('../utilities/utils').db;

var router = express.Router();

let sendEmail = require('../utilities/utils').sendEmail;

router.post("/sendRequest", (req, res) => {
    let username = req.body['username'];
    let connection = req.body['connection'];
    
    if(!username || !connection) {
        res.send({
            success: false,
            error: "Username or newConnectionName not supplied"
        });
        return;
    }
          

    let insert1 = `INSERT INTO contacts(memberid_a, memberid_b, verified) 
                    VALUES ((SELECT memberid 
                    FROM members 
                    WHERE username = $1), 
                    (SELECT memberid 
                        FROM members 
                        WHERE username = $2),
                    0);`
                   
    db.none(insert1, [username, connection])
    .then(() => {
        res.send({
            success: true
        });
    }).catch((err) => {
        res.send({
            success: false,
            error: err,
        });
    });
    
});

router.post("/invite", (req, res) => {
    res.type("application/json");
    //Retrieve data from query params
    var username = req.body['username'];
    var friendName = req.body['friendName'];
    var friendEmail = req.body['friendEmail'];
    if(friendName && friendEmail && username) {
        var good = true;
        var pattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/; 
        if(!pattern.test(friendEmail)){
            good = false;
        }
        if(username.length < 3){
            good = false;
        }

        if(!good){
            res.send({
                success: false,
                input: req.body,
                message: "Make sure username is longer than 3 characters and email is in valid form."
            });
        }

        db.one('SELECT FROM Members WHERE username=$1', [username])
        .then((row) => {
            sendEmail("No-reply@chat", friendEmail,"You're Invited To Join Our App",  "Hi " + friendName + ", our user " + username + " has invited you to try out our app. Visit this link https//450Chat.com to download our app today!.");
            res.send({
                success: true,
                message: "Sent!",
            });
        }).catch((err) => {
            res.send({
                success: false,
                message: "Error when finding the input username.",
                error: err
            });
        });
    } else {
        res.send({
            success: false,
            input: req.body,
            error: "Missing required information."
        });
    }
});
module.exports = router;