let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let companySchema = new Schema({
    companyName: {
        type: String,
        required: true
    },
    companyAddress: {
        type: String,
        required: true
    },
    companyLocation: {
        latitude: Number,
        longitude: Number
    },
    positions: [{
        type: String,
        required: true
    }],
    branches: [{
        type: mongoose.Types.ObjectId,
        ref: 'Branch'
    }]
}, {
	timestamps: true
});

var Company = mongoose.model('Company', companySchema);

module.exports = Company;