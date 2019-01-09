//express is the framework we're going to use to handle requests
const express = require('express');
//Create a new instance of express
const app = express();
//Create connection to Heroku Database
let db = require('../utilities/utils').db;

var router = express.Router();


router.post("/addToChat", (req, res) => {
    
    var chatId = req.body['chatId'];
    var username = req.body['username'];
    
    
    if(!chatId || !username) {
        res.send({
            success: false,
            error: "no chat name or Username passed in to addtoChat"
        });
        return;
    }
    let add =  `INSERT INTO Chatmembers(chatid, memberid) 
                VALUES ($1, 
                (SELECT memberid 
                FROM members 
                WHERE username = $2))`

    db.none(add, [chatId, username])
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

module.exports = router;