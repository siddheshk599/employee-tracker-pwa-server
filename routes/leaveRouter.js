let express = require('express');
let bodyParser = require('body-parser');
let cors = require('./cors');
let authenticate = require('../authenticate');
let functions = require('../shared/functions');

let Leave = require('../models/leave');

let leaveRouter = express.Router();

leaveRouter.use(bodyParser.json());

// '/leaves' route
leaveRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdminManager, (req, res, next) => {
    Leave.find(req.query)
    .populate({
        path: 'empId',
        model: 'Employee',
        populate: {
            path: 'companyId',
            model: 'Company'
        }
    })
    .populate({
        path: 'empId',
        model: 'Employee',
        populate: {
            path: 'branchId',
            model: 'Branch'
        }
    })
    .populate({
        path: 'empId',
        model: 'Employee',
        populate: {
            path: 'activeAttendanceId',
            model: 'Attendance'
        }
    })
    .populate('decisionBy')
    .sort({ fromDate: 1 })
    .then((leaves) => {
        if (leaves != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(leaves);
        } else {
            let error = functions.errorGeneration('No leave records with specified criteria exist.', 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation is not supported on /leaves.`);
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
   Leave.create(req.body)
   .then((leave) => {
       Leave.findById(leave._id)
       .populate({
            path: 'empId',
            model: 'Employee',
            populate: {
                path: 'companyId',
                model: 'Company'
            }
        })
        .populate({
            path: 'empId',
            model: 'Employee',
            populate: {
                path: 'branchId',
                model: 'Branch'
            }
        })
        .populate({
            path: 'empId',
            model: 'Employee',
            populate: {
                path: 'activeAttendanceId',
                model: 'Attendance'
            }
        })
        .populate('decisionBy')
       .then((leave) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(leave);
       })
       .catch((error) => next(error));    
   })
   .catch((error) => next(error));
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`DELETE operation is not supported on /leaves.`);
});

// '/leaves/:leaveId' route
leaveRouter.route('/:leaveId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdminManager, (req, res, next) => {
    Leave.findById(req.params.leaveId)
    .populate({
        path: 'empId',
        model: 'Employee',
        populate: {
            path: 'companyId',
            model: 'Company'
        }
    })
    .populate({
        path: 'empId',
        model: 'Employee',
        populate: {
            path: 'branchId',
            model: 'Branch'
        }
    })
    .populate({
        path: 'empId',
        model: 'Employee',
        populate: {
            path: 'activeAttendanceId',
            model: 'Attendance'
        }
    })
    .populate('decisionBy')
    .then((leave) => {
        if (leave != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(leave);

        } else {
            let error = functions.errorGeneration(`Leave record with ID ${req.params.leaveId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdminManager, (req, res, next) => {
    Leave.findById(req.params.leaveId)
    .then((leave) => {
        if (leave != null) {
            Leave.findByIdAndUpdate(req.params.leaveId, {
                $set: req.body
            }, { new: true })
            .populate({
                path: 'empId',
                model: 'Employee',
                populate: {
                    path: 'companyId',
                    model: 'Company'
                }
            })
            .populate({
                path: 'empId',
                model: 'Employee',
                populate: {
                    path: 'branchId',
                    model: 'Branch'
                }
            })
            .populate({
                path: 'empId',
                model: 'Employee',
                populate: {
                    path: 'activeAttendanceId',
                    model: 'Attendance'
                }
            })
            .populate('decisionBy')
            .then((leave) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(leave);
            })
            .catch((error) => next(error));

        } else {
            let error = functions.errorGeneration(`Leave record with ID ${req.params.leaveId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
   res.statusCode = 403;
    res.end(`POST operation is not supported on /leaves/${req.params.leaveId}.`);
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    Leave.findById(req.params.leaveId)
    .then((leave) => {
        if (leave != null) {
            Leave.findByIdAndRemove(req.params.leaveId)
            .populate({
                path: 'empId',
                model: 'Employee',
                populate: {
                    path: 'companyId',
                    model: 'Company'
                }
            })
            .populate({
                path: 'empId',
                model: 'Employee',
                populate: {
                    path: 'branchId',
                    model: 'Branch'
                }
            })
            .populate({
                path: 'empId',
                model: 'Employee',
                populate: {
                    path: 'activeAttendanceId',
                    model: 'Attendance'
                }
            })
            .populate('decisionBy')
            .then((leave) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(leave);
            })
            .catch((error) => next(error));

        } else {
            let error = functions.errorGeneration(`Leave record with ID ${req.params.leaveId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
});

module.exports = leaveRouter;