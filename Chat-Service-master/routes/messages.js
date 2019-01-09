//express is the framework we're going to use to handle requests
const express = require('express');

const bodyParser = require("body-parser");

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

var router = express.Router();
router.use(bodyParser.json());

router.post("/sendMessages", (req, res) => {
    let username = req.body['username'];
    let message = req.body['message'];
    let chatId = req.body['chatId'];
    if(!username || !message || !chatId) {
        res.send({
            success: false,
            error: "Username, message, or chatId not supplied"
        });
        return;
    }

    let insert =   `INSERT INTO Messages(ChatId, Message, MemberId)
                    SELECT $1, $2, MemberId FROM Members
                    WHERE Username=$3`
    db.none(insert, [chatId, message, username])
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

router.get("/getMessages", (req, res) => {
    let chatId = req.query['chatId'];
    let after = req.query['after'];
    let query = `SELECT Members.Username, Messages.Message,
                 to_char(Messages.Timestamp AT TIME ZONE 'PDT', 'YYYY-MM-DD HH24:MI:SS.US' ) AS TimeStamp
                 FROM Messages
                 INNER JOIN Members ON Messages.MemberId=Members.MemberId
                 WHERE ChatId=$2 AND
                 TimeStamp AT TIME ZONE 'PDT' > $1
                 ORDER BY TimeStamp ASC`
    db.manyOrNone(query, [after, chatId])
    .then((rows) => {
        res.send({
            messages: rows
        })
    }).catch((err) => {
        res.send({
            success: false,
            error: err
        })
    });
});

router.get("/getallmessages", (req, res) => {
    let username = req.query['username'];
    let timestamp = req.query['after'];

    let query = `SELECT M.chatid, M.message, M.memberid, M.timestamp
                FROM Messages M INNER JOIN 
                ChatMembers C ON C.chatid = M.chatid 
                WHERE M.timestamp AT TIME ZONE 'PDT' > $2 
                AND C.memberid = (SELECT memberid FROM Members WHERE username=$1)`
    db.manyOrNone(query, [username, timestamp])
    .then((rows) => {
        res.send({
            chatid: rows
        })
    }).catch((err) => {
        res.send({
            success: false,
            error: err
        })
    });
});

module.exports = router;