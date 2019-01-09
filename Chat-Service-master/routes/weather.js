//express is the framework we're going to use to handle requests
const express = require('express');

//request module is needed to make a request to a web service
const request = require('request');

const bodyParser = require("body-parser");

var router = express.Router();
router.use(bodyParser.json());

const API_KEY = process.env.APIXU_KEY;


router.post("/current", (req, res) => {
    res.type("application/json");
    var loc = req.body['username'];
    var url = `http://api.apixu.com/v1/current.json?key=${API_KEY}&q=${loc}`;
    
    request(url, function (error, response, body) {
        if (error) {
            res.send(error);
        } else {
            res.send(body);
            //res.send(response);
        }
    });
});

router.post("/forecast", (req, res) => {
    res.type("application/json");
    var loc = req.body['username'];
    var days = req.body['email'];
    var url = `http://api.apixu.com/v1/forecast.json?key=${API_KEY}&q=${loc}&days=${days}`;
    
    request(url, function (error, response, body) {
        if (error) {
            res.send(error);
        } else {
            res.send(body);
        }
    });
});


module.exports = router;