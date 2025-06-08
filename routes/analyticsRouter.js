let express = require('express');
let bodyParser = require('body-parser');
let functions = require('../shared/functions');
let cors = require('./cors');
let authenticate = require('../authenticate');

let Employee = require('../models/employee');
let Company = require('../models/company');
let Branch = require('../models/branch');
let Attendance = require('../models/attendance');
let SalaryAdvance = require('../models/salaryAdvance');

let analyticsRouter = express.Router();

analyticsRouter.use(bodyParser.json());

// '/analytics' route
analyticsRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    if (req.query['empId']) {
        let analytics = {
            companyCount: {
                text: 'Company Count',
                value: 0
            },
            branchCount: {
                text: 'Branch Count',
                value: 0
            },
            employeeCount: {
                text: "Employees' Count",
                value: 0
            },
            attendanceCount: {
                text: 'Present Attendance Count',
                value: 0
            },
            approvedSalaryAdvanceCount: {
                text: 'Approved Salary Advance Count',
                value: 0
            },
            approvedPaidLeavesCount: {
                text: 'Approved Paid Leaves Count',
                value: 0
            }
        };

        Employee.findById(req.query['empId'])
        .then((employee) => {
            if (employee != null) {
                Company.find((
                    (employee.position == 'admin') ? 
                    {} : { _id: employee.companyId }
                ))
                .then((companies) => {
                    analytics.companyCount.value = companies.length;

                    Branch.find((
                        (employee.position == 'admin') ? 
                        {} : { companyId: employee.companyId }
                    )).then((branches) => {
                        analytics.branchCount.value = branches.length;

                        Employee.find((
                            (employee.position == 'admin') ? 
                            {} : { companyId: employee.companyId }
                        )).then((employees) => {
                            analytics.employeeCount.value = employees.length;

                            Attendance.find((
                                (employee.position == 'admin') ? {
                                    inTime: { $exists: true },
                                    outTime: { $exists: true },
                                    status: {
                                        $in: ['on-time', 'late']
                                    }
                                } : {
                                    inTime: { $exists: true },
                                    outTime: { $exists: true },
                                    status: {
                                        $in: ['on-time', 'late']
                                    },
                                    empId: {
                                        $in: [...employees.map((employee) => employee._id)]
                                    }
                                }
                            ))
                            .then((presentAttendances) => {
                                analytics.attendanceCount.value = presentAttendances.length;

                                Attendance.find((
                                    (employee.position == 'admin') ? {
                                        inTime: { $exists: true },
                                        outTime: { $exists: true },
                                        status: 'paid_leave'
                                    } : {
                                        inTime: { $exists: true },
                                        outTime: { $exists: true },
                                        status: 'paid_leave',
                                        empId: {
                                            $in: [...employees.map((employee) => employee._id)]
                                        }
                                    }
                                ))
                                .then((paidLeaves) => {
                                    analytics.approvedPaidLeavesCount.value = paidLeaves.length;

                                    SalaryAdvance.find((
                                        (employee.position == 'admin') ? {
                                            status: 'approved'
                                        } : {
                                            status: 'approved',
                                            empId: {
                                                $in: [...employees.map((employee) => employee._id)]
                                            }
                                        }
                                    ))
                                    .then((salAdvances) => {
                                        analytics.approvedSalaryAdvanceCount.value = salAdvances.length;
    
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(analytics);
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
                let error = functions.errorGeneration(`Employee record with ID ${req.query['empId']} not found.`, 404);
                return next(error);
            }
        })
        .catch((error) => next(error));
    } else {
        res.statusCode = 403;
        res.end('Employee ID not specified with request.');
    }
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation is not supported on /analytics.`);
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`POST operation is not supported on /analytics.`);
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`DELETE operation is not supported on /analytics.`);
});

module.exports = analyticsRouter;