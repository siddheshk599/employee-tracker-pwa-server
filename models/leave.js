let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let leaveSchema = new Schema({
    empId: {
        type: mongoose.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    fromDate: {
        type: Date,
        required: true
    },
    tillDate: {
        type: Date,
        required: true
    },
    leaveType: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    decisionBy: {
        type: mongoose.Types.ObjectId,
        ref: 'Employee'
    }
}, {
    timestamps: true
});

var Leaves = mongoose.model('Leave', leaveSchema);

module.exports = Leaves;
