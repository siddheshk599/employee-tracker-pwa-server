let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let passportLocalMongoose = require('passport-local-mongoose');

let employeeSchema = new Schema({
    companyId: {
        type: mongoose.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    branchId: {
        type: mongoose.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    position: {
        type: String,
        required: true
    },
    empId: {
        type: String
    },
    empName: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true
    },
    workingDays: [{
        type: String,
        required: true
    }],
    inTime: {
        type: Date,
        required: true
    },
    outTime: {
        type: Date,
        required: true
    },
    canPunchInOutAnywhere: {
        type: Boolean,
        required: true
    },
    salaryType: {
        type: String,
        required: true
    },
    salaryAmount: {
        type: Number,
        required: true
    },
    joiningDate: {
        type: Date
    },
    emailId: {
        type: String
    },
    dob: {
        type: Date
    },
    address: {
        type: String
    },
    bankAccNo: {
        type: String
    },
    bankIfsc: {
        type: String
    },
    aadhaar: {
        type: String
    },
    pan: {
        type: String
    },
    username: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        required: true
    },
    hasApproval: {
        type: Boolean,
        required: true
    },
    photoImg: {
        type: String
    },
    activeAttendanceId: {
        type: mongoose.Types.ObjectId,
        ref: 'Attendance'
    },
    nextPossiblePunchIn: {
        type: Date
    }
}, {
    timestamps: true
});

employeeSchema.plugin(passportLocalMongoose);

var Employees = mongoose.model('Employee', employeeSchema);

module.exports = Employees;
