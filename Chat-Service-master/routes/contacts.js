//express is the framework we're going to use to handle requests
const express = require('express');
//Create a new instance of express
const app = express();
//Create connection to Heroku Database
let db = require('../utilities/utils').db;
var router = express.Router();
router.post("/searchContact", (req, res) => {
    let term = req.body['term'].toLowerCase();
    let username = req.body['username'];
    if(!term || term.length == 0) {
        res.send({
            success: false,
            error: "Missing searching term."
        });
        return;
    }
    let search = 'SELECT M.FirstName, M.LastName, M.Username, M.Email FROM Members M WHERE ((LOWER(M.FirstName) LIKE \'' + term + '%\' OR LOWER(M.LastName) LIKE \'' + term + '%\' OR LOWER(M.Username) LIKE \'' + term + '%\' OR LOWER(M.Email) LIKE \'' + term + '%\') AND (NOT M.username=$1)) EXCEPT SELECT M2.FirstName, M2.LastName, M2.Username, M2.Email FROM Members M2  INNER JOIN Contacts C2 ON (M2.memberid=C2.memberid_b) WHERE C2.memberid_a=(SELECT memberid FROM Members WHERE username=$1)'

    // let search = 'SELECT M.memberid, M.FirstName, M.LastName, M.Username, M.Email FROM Members M WHERE (M.FirstName LIKE \'%' + term + '%\' OR M.LastName LIKE \'%' + term + '%\' OR M.Username LIKE \'%' + term + '%\' OR M.Email LIKE \'%' + term + '%\')'
    //console.log(search);
    db.manyOrNone(search, [username])
     .then((rows) => {
        res.send({
            success: true,
            message: rows
        });
    }).catch((err) => {
        res.send({
            success: false,
            error: err
        });
    });
});

router.post("/getContacts", (req, res) => {
    let username = req.body['username'];
    if(!username) {
        res.send({
            success: false,
            error: 'Missing username.'
        });
    }
    let search = 'SELECT M.memberId, M.FirstName, M.LastName, M.Username, M.Email FROM Members M INNER JOIN Contacts C ON M.MemberId = C.memberid_b WHERE C.memberid_a = (SELECT memberid FROM Members WHERE username=$1) AND C.Verified=1'

    db.manyOrNone(search, [username])
     .then((rows) => {
        res.send({
            success: true,
            message: rows
        });
    }).catch((err) => {
        res.send({
            success: false,
            message: 'Error when searching through database.',
            error: err
        });
    });
});

module.exports = router;