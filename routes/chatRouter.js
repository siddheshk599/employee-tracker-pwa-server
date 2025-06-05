let express = require('express');
let bodyParser = require('body-parser');
let cors = require('./cors');
let authenticate = require('../authenticate');
let functions = require('../shared/functions');

let Chat = require('../models/chat');

let chatRouter = express.Router();

chatRouter.use(bodyParser.json());

// '/chats' route
chatRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
    if (
        (req.query['empId']) ||
        (req.query['senderEmpId'] && req.query['receiverEmpId'])
    ) {
        let query = {};

        if (req.query['empId']) {
            query = {
                $or: [
                    { senderEmpId: req.query['empId'] },
                    { receiverEmpId: req.query['empId'] }
                ]
            };

        } else if (req.query['senderEmpId'] && req.query['receiverEmpId']) {
            query = {
                senderEmpId: {
                    $in: [req.query['senderEmpId'], req.query['receiverEmpId']]
                },
                receiverEmpId: {
                    $in: [req.query['senderEmpId'], req.query['receiverEmpId']]
                }
            };
        }

        Chat.find(query)
        .populate('senderEmpId')
        .populate('receiverEmpId')
        .sort({ createdAt: 1 })
        .then((chats) => {
            if (chats != null) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(chats);

            } else {
                let error = new functions.errorGeneration(`Chat record(s) for specified employee ID(s) not found.`, 404);
                return next(error);
            }
        })
        .catch((error) => next(error));
        
    } else {
        Chat.find(req.query)
        .populate('senderEmpId')
        .populate('receiverEmpId')
        .sort({ createdAt: 1 })
        .then((chats) => {
            if (chats != null) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(chats);

            } else {
                let error = new functions.errorGeneration(`Chat record(s) not found.`, 404);
                return next(error);
            }
        })
        .catch((error) => next(error));
    }
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
    Chat.create(req.body)
    .then((chat) => {
        Chat.findById(chat._id)
        .populate('senderEmpId')
        .populate('receiverEmpId')
        .then((chat) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(chat);
        })
        .catch((error) => next(error));
    })
    .catch((error) => next(error));
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /chats.');
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('DELETE operation is not supported on /chats.');
});

module.exports = chatRouter;