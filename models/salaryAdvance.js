let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let salaryAdvanceSchema = new Schema({
    empId: {
        type: mongoose.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    advanceAmount: {
        type: Number,
        required: true
    },
    advanceDate: {
        type: Date,
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

var SalaryAdvance = mongoose.model('SalaryAdvance', salaryAdvanceSchema);

module.exports = SalaryAdvance;