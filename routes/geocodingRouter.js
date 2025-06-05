let express = require('express');
let bodyParser = require('body-parser');
let NodeGeocoder = require('node-geocoder');
let functions = require('../shared/functions');
let cors = require('./cors');
let authenticate = require('../authenticate');

let geocodingRouter = express.Router();

geocodingRouter.use(bodyParser.json());

// '/geocoding' route
geocodingRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, (req, res, next) => {
    let geocoder = NodeGeocoder({ provider: 'openstreetmap' });

    if (req.query['type'] == 'forward' && req.query['address']) {
        let address = decodeURIComponent(req.query['address']);
        
        geocoder.geocode(address)
        .then((result) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(result);
        })
        .catch((error) => next(error));

    } else if (req.query['type'] == 'backward' && req.query['latitude'] && req.query['longitude']) {
        let coordinates = {
            lat: eval(req.query['latitude']),
            lon: eval(req.query['longitude'])
        };

        geocoder.reverse(coordinates)
        .then((result) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(result);
        })
        .catch((error) => next(error));

    } else {
        let error = functions.errorGeneration('Geocoding type or location address or location coordinates not specified in the request.', 404);
        return next(error);
    }
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation is not supported on /geocoding.`);
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
    res.statusCode = 403;
    res.end(`POST operation is not supported on /geocoding.`);
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
    res.statusCode = 403;
    res.end(`DELETE operation is not supported on /geocoding.`);
});

module.exports = geocodingRouter;