let express = require('express');
let bodyParser = require('body-parser');
let functions = require('../shared/functions');
let cors = require('./cors');
let authenticate = require('../authenticate');

let Attendance = require('../models/attendance');
let Branch = require('../models/branch');
let Chat = require('../models/chat');
let Company = require('../models/company');
let Employee = require('../models/employee');
let Leave = require('../models/leave');
let SalaryAdvance = require('../models/salaryAdvance');

let branchRouter = express.Router();

branchRouter.use(bodyParser.json());

// '/branches' route
branchRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation is not supported on /branches.');
})
.post(cors.corsWithOptions, (req, res, next) => {
    Branch.create(req.body)
    .then((branch) => {
        Branch.findById(branch._id)
        .populate('companyId')
        .then((branch) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(branch);
        })
        .catch((error) => next(error));
    })
    .catch((error) => next(error));
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /branches.');
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('DELETE operation is not supported on /branches.');
});

// '/branches/:branchId' route
branchRouter.route('/:branchId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
    Branch.findById(req.params.branchId)
    .populate('companyId')
    .then((branch) => {
        if (branch != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(branch);
            
        } else {
            let error = functions.errorGeneration(`Branch record with ID ${req.params.branchId} not found.`, 404);
            return next(error);
        }
        
    })
    .catch((error) => next(error));
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`POST operation is not supported on /branches/${req.params.branchId}.`);
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    Branch.findById(req.params.branchId)
    .then((branch) => {
        if (branch != null) {
            Branch.findByIdAndUpdate(req.params.branchId, {
                $set: req.body
            }, { new: true })
            .populate('companyId')
            .then((branch) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(branch);
            })
            .catch((error) => next(error));

        } else {
            let error = functions.errorGeneration(`Branch record with ID ${req.params.branchId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {

    Branch.findById(req.params.branchId)
    .then((branch) => {
        if (branch != null) {
            Employee.find({ branchId: req.params.branchId })
            .then((employees) => {
                let employeeIds = employees.map((employee) => employee._id);

                Attendance.deleteMany({ empId: { $in: employeeIds } })
                .then((attendances) => {
                    
                    Chat.deleteMany({
                        $or: [
                            { senderEmpId: { $in: employeeIds } },
                            { receiverEmpId: { $in: employeeIds } }
                        ]
                    })
                    .then((chats) => {
                        
                        Employee.deleteMany({ _id: { $in: employeeIds } })
                        .then((employees) => {
                            
                            Leave.deleteMany({ empId: { $in: employeeIds } })
                            .then((leaves) => {

                                SalaryAdvance.deleteMany({ empId: { $in: employeeIds } })
                                .then((salaryAdvances) => {

                                    Branch.findByIdAndRemove(req.params.branchId)
                                    .then((deletedBranch) => {
                                        Company.findById(deletedBranch.companyId)
                                        .then((company) => {
                                            let branchIndex = company.branches.indexOf(deletedBranch._id);

                                            company.branches.splice(branchIndex, 1);

                                            company.save().then((company) => {
                                                res.statusCode = 200;
                                                res.setHeader('Content-Type', 'application/json');
                                                res.json(deletedBranch);
                                            })
                                            .catch((error) => next(error));
                                        })
                                        .catch((error) => next(error));
                                    })
                                    .catch((error) => next(error));

                                })
                                .catch((error) => next(error));
                            })
                            .catch((error) => next(error));
                        })
                        .catch((error) => next(error));
                    })
                    .catch((error) => next(error));
                })
                .catch((error) => next(error));
            })
            .catch((error) => next(error));

        } else {
            let error = functions.errorGeneration(`Branch record with ID ${req.params.branchId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
});

module.exports = branchRouter;