const express = require('express');
const cors = require('cors');
const app = express();

var corsOptionsDelegate = (req, callback) => {
    var corsOptions = { origin: true };
    callback(null, corsOptions);
};

exports.cors = cors();
exports.corsWithOptions = cors(corsOptionsDelegate);