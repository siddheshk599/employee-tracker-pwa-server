let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let chatSchema = new Schema({
    senderEmpId: {
        type: mongoose.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    receiverEmpId: {
        type: mongoose.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    message: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

var Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;