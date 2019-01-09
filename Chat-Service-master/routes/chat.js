//express is the framework we're going to use to handle requests
const express = require('express');
//Create a new instance of express
const app = express();
//Create connection to Heroku Database
let db = require('../utilities/utils').db;

var router = express.Router();

router.post("/createChat", (req, res) => {
    var chatName = req.body['chatName'];
    var username = req.body['username'];
    var contactList = req.body['checkbox']; // should be array of usernames

    console.log("List is " + contactList[0] + " " + contactList[1]);

    
    if(!chatName || !username || !contactList) {
        res.send({
            success: false,
            error: "no chat name or Username passed in or no connections checked off to create multichat"
        });
        
    }
    let createChat =  `INSERT INTO Chats(name) 
                       VALUES($1) RETURNING *`

    db.one(createChat, [chatName])
    .then((rows) => {
        var chatId = rows.chatid;
        console.log("Chat id is :" + chatId);
        console.log(contactList.length);
        let addUser = `INSERT INTO Chatmembers(chatid, memberid) 
                    VALUES ($1,
                    (SELECT memberid 
                    FROM members 
                    WHERE username = $2))`
                   
        db.none(addUser, [chatId, username])
        .then(() => {
            if (contactList.length > 0) {
                let addMoreUsers = "INSERT INTO Chatmembers(chatid, memberid) VALUES ($1, (SELECT memberid FROM members WHERE username=\'" + contactList[0]+ "\'))";
                for (i = 1; i< contactList.length; i++) {
                    addMoreUsers+= ", ($1, (SELECT memberid FROM members WHERE username=\'" + contactList[i]+ "\'))";
                }
                console.log(addMoreUsers);
                db.none(addMoreUsers, [chatId])
                .then(() => {
                    res.send({
                        success: true,
                        message: "Successfully added all users to the new chat.",
                        chatId: chatId
                    });
                }).catch((err) => {
                    res.send({
                        success: false,
                        message: "One or more of the users added to chat returned an error. Make sure username inputs are correct.",
                        error: err
                    });
                });
            }

        }).catch((err) => {
            res.send({
                success: false,
                message: "" + username +" not added to chat.",
                error: err
            });
        });
    }).catch((err) => {
        res.send({
            success: false,
            message: "Chat creation failed",
            error: err
        });
    });
    
    
});

module.exports = router;