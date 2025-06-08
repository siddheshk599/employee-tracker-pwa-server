let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let attendanceSchema = new Schema({
    empId: {
        type: mongoose.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    inTime: {
        type: Date,
        required: true
    },
    outTime: {
        type: Date
    },
    punchInImg: {
    	type: String
    },
    punchOutImg: {
    	type: String
    },
    punchInLocation: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    punchOutLocation: {
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        }
    },
    punchInDoneBy: {
        type: mongoose.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    punchOutDoneBy: {
        type: mongoose.Types.ObjectId,
        ref: 'Employee'
    },
    status: {
        type: String,
        required: true
    },
    locationHistory: [{
        type: new Schema({
            latitude: {
                type: Number,
                required: true
            },
            longitude: {
                type: Number,
                required: true
            }
        }, {
            timestamps: true
        })
    }]
}, {
	timestamps: true
});

var Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;