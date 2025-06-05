let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let branchSchema = new Schema({
    companyId: {
        type: mongoose.Types.ObjectId,
        ref: 'Company'
    },
    branchName: {
        type: String,
        required: true
    },
    branchAddress: {
        type: String,
        required: true
    },
    branchLocation: {
        latitude: Number,
        longitude: Number
    }
}, {
	timestamps: true
});

var Branch = mongoose.model('Branch', branchSchema);

module.exports = Branch;