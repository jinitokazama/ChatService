//express is the framework we're going to use to handle requests
const express = require('express');

const bodyParser = require("body-parser");

//Create connection to Heroku Database
let db = require('../utilities/utils').db;
                    
var router = express.Router();
router.use(bodyParser.json());

//used to request all incoming connections.
router.get("/incoming", (req, res) => {

    let clientUsername = req.query['username'];
    let after = req.query['after'];

    let query =`SELECT Members.firstname, Members.lastname, Members.username, Members.email, Contacts.RequestTime
                FROM Contacts INNER JOIN 
                Members ON Members.memberid = Contacts.memberid_a
                WHERE Contacts.verified = 0 AND 
                    Contacts.memberid_b = 
                    (SELECT Members.memberid 
                    FROM Members
                    WHERE Members.username = $1)
                    AND RequestTime AT TIME ZONE 'PDT' > $2
                    ORDER BY RequestTime ASC`
    db.manyOrNone(query,[clientUsername, after])
    .then((rows) => {
        res.send({
            success:true,
            pending: rows
        })
    }).catch((err) => {
        res.send({
            success: false,
            error: err
        })
    });
});

//used to respond to incoming connection request.
// answer should be 1 for accept or 0 for deny.
router.post("/incoming", (req, res) => {
    let clientUsername = req.body['username'];
    let otherUsername = req.body['otherUsername'];
    let decision = req.body['answer'];


    let reCheck = 'SELECT * FROM Contacts WHERE memberid_a=(SELECT memberid FROM Members WHERE username = $2) AND memberid_b = (SELECT memberid FROM Members WHERE username=$1) AND Verified=0'
    db.one(reCheck, [clientUsername, otherUsername])
    .then((row) => {
        let passCheck = (row != {});
        if(decision && passCheck) {
            // Verify request, then delete any requests in opposite direction, then add verified conection in opposite direction:
            let verify ='UPDATE Contacts SET verified =1 WHERE memberid_a = (SELECT memberid FROM Members WHERE username = $2) AND memberid_b = (SELECT memberid FROM Members WHERE username = $1)'
            let remove ='DELETE FROM Contacts WHERE memberid_a=(SELECT memberid FROM Members WHERE username = $1) AND memberid_b = (SELECT memberid FROM Members WHERE username=$2)'
            let add = "INSERT INTO Contacts (memberid_a, memberid_b, verified) VALUES ((SELECT memberid FROM Members WHERE username=$1), (SELECT memberid FROM Members WHERE username=$2), 1)"
            db.none(verify, [clientUsername, otherUsername])
            .then(() => {
                db.none(remove, [clientUsername, otherUsername])
                .then(() =>{
                    db.none(add, [clientUsername, otherUsername])
                    .then(()=> {
                        res.send({
                            success: true
                        })
                    }).catch((err) => {
                        res.send({
                            success:  false,
                            error: err
                        })
                    });
                }).catch((err) =>{
                    res.send({
                        success: false,
                        error: err
                    })
                });
            }).catch((err) =>{
                res.send({
                    success: false,
                    error: err
                })
            });
        } else if (!decision && passCheck) {
            //deny request = remove from database.
            let query = 'DELETE FROM Contacts WHERE memberid_a = (SELECT memberid FROM Members WHERE username=$2) AND memberid_b = (SELECT memberid FROM Members WHERE username=$1) AND verified = 0'
            db.none(query, [clientUsername, otherUsername])
            .then((rws) => {
                res.send({
                    success: true
                })
            }).catch((err) =>{
                res.send({
                    success: false,
                    error: err
                })
            });
        }
    }).catch((err) => {
        if (err.code == 0) {
            res.send({
                success: false,
                pending: false,
                message : "This pending connection is no longer available."
            })
        } else {
            res.send({
                success: false,
                error: err
            })
        }
    });
});

//used to request all outgoing connections.
router.get("/outgoing", (req, res) => {

    let clientUsername = req.query['username'];
    let after = req.query['after'];

    let query =`SELECT Members.firstname, Members.lastname, Members.username, Members.email, Contacts.RequestTime
                FROM Contacts INNER JOIN 
                Members ON Members.memberid = Contacts.memberid_b
                WHERE Contacts.verified = 0 AND 
                    Contacts.memberid_a = 
                   (SELECT Members.memberid 
                    FROM Members
                    WHERE Members.username = $1)
                    AND RequestTime AT TIME ZONE 'PDT' > $2
                    ORDER BY RequestTime ASC`
    db.manyOrNone(query,[clientUsername, after])
    .then((rows) => {
        res.send({
            success:true,
            pending: rows
        })
    }).catch((err) => {
        res.send({
            success: false,
            error: err
        })
    });
});

//used to cancel an outgoing connection request.
router.post("/outgoing", (req, res) => {
    let clientUsername = req.body['username'];
    let otherUsername = req.body['otherUsername'];



    let check = 'SELECT * FROM Contacts WHERE memberid_a = (SELECT memberid FROM Members WHERE username=$1) AND memberid_b = (SELECT memberid FROM Members WHERE username=$2) AND Verified=0'
    db.one(check, [clientUsername, otherUsername])
    .then((row) =>  {
        let query = 'DELETE FROM Contacts WHERE memberid_a = (SELECT memberid FROM Members WHERE username=$1) AND memberid_b = (SELECT memberid FROM Members WHERE username=$2) AND Verified=0'
        db.none(query, [clientUsername, otherUsername])
        .then(() => {
            res.send({
                success: true
            })
        }).catch((err) =>{
            res.send({
                success: false,
                error: err
            })
        });
    }).catch((err) =>{
        console.log(err.code);
        if (err.code == 0) {
            res.send({
                success: false,
                pending: false,
                message: "This pending connection has either been replied or does not exist."
            })
        } else {
            res.send({
                success: false,
                error: err
            })
        }
    });
    
});

module.exports = router;
