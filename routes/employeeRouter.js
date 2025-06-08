let express = require('express');
let bodyParser = require('body-parser');
let functions = require('../shared/functions');
let cors = require('./cors');
let authenticate = require('../authenticate');

let Attendance = require('../models/attendance');
let Chat = require('../models/chat');
let Leave = require('../models/leave');
let SalaryAdvance = require('../models/salaryAdvance');
let Employee = require('../models/employee');

let employeeRouter = express.Router();

employeeRouter.use(bodyParser.json());

// '/employees' route
employeeRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    if (req.query['hasApproval'])
        req.query['hasApproval'] = eval(req.query['hasApproval']);
        
    if (req.query['isActive'])
        req.query['isActive'] = eval(req.query['isActive']);

    Employee.find(req.query)
    .populate({
        path: 'companyId',
        model: 'Company',
        populate: {
            path: 'branches',
            model: 'Branch'
        }
    })
    .populate('branchId')
    .populate('activeAttendanceId')
    .sort({ empName: 1 })
    .then((employees) => {
        if (employees != null || employees.length > 0) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(employees);

        } else {
            let error = functions.errorGeneration('Employee record(s) not found.', 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation is not supported on /employees.`);
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`POST operation is not supported on /employees.`);
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`DELETE operation is not supported on /employees.`);
});

// '/employees/:employeeId' route
employeeRouter.route('/:employeeId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.cors, authenticate.verifyEmployee, (req, res, next) => {
    if (req.query['getChatReceivers']) {
        if (req.query['hasApproval'])
            req.query['hasApproval'] = eval(req.query['hasApproval']);
        
        if (req.query['isActive'])
            req.query['isActive'] = eval(req.query['isActive']);

        let companyId = req.query['companyId'];

        Employee.find({
            _id: { $ne: req.params.employeeId },
            isActive: req.query['isActive'],
            hasApproval: req.query['hasApproval'],
            $or: [
                { position: 'admin' },
                { companyId: companyId }
            ]
        })
        .populate('companyId')
        .populate('branchId')
        .sort({ empName: 1 })
        .then((employees) => {
            if (employees != null || employees.length > 0) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(employees);

            } else {
                let error = functions.errorGeneration('No employee record(s) with the specified criteria exist.', 404);
                return next(error);
            }
        })
        .catch((error) => next(error));

    } else {
        Employee.findById(req.params.employeeId)
        .populate({
            path: 'companyId',
            model: 'Company',
            populate: {
                path: 'branches',
                model: 'Branch'
            }
        })
        .populate('branchId')
        .populate('activeAttendanceId')
        .then((employee) => {
            if (employee != null) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(employee);

            } else {
                let error = functions.errorGeneration(`Employee record with ID ${req.params.employeeId} not found.`, 404);
                return next(error);
            }
        })
        .catch((error) => next(error));
    }
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
    Employee.findById(req.params.employeeId)
    .then((result) => {
        if (result != null) {
            Employee.findByIdAndUpdate(req.params.employeeId, (
                (
                    req.query['activeAttendanceId'] == "false" || 
                    req.query['nextPossiblePunchIn'] == "false"
                ) ? { $unset: req.body } : { $set: req.body }
            ), { new: true })
            .populate({
                path: 'companyId',
                model: 'Company',
                populate: {
                    path: 'branches',
                    model: 'Branch'
                }
            })
            .populate('branchId')
            .populate('activeAttendanceId')
            .then((employee) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(employee);
            })
            .catch((error) => next(error));
            
        } else {
            let error = functions.errorGeneration(`Employee record(s) with ID ${req.params.employeeId} and specified query not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`POST operation is not supported on /employees/${req.params.employeeId}.`);
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
    Employee.findById(req.params.employeeId)
    .then((employee) => {
        if (employee != null) {
            Attendance.deleteMany({ empId: req.params.employeeId })
            .then((attendances) => {
                
                Chat.deleteMany({
                    $or: [
                        { senderEmpId: req.params.employeeId },
                        { receiverEmpId: req.params.employeeId }
                    ]
                })
                .then((chats) => {
                    
                    Leave.deleteMany({ empId: req.params.employeeId })
                    .then((leaves) => {

                        SalaryAdvance.deleteMany({ empId: req.params.employeeId })
                        .then((salaryAdvances) => {

                            Employee.findByIdAndRemove(req.params.employeeId)
                            .populate({
                                path: 'companyId',
                                model: 'Company',
                                populate: {
                                    path: 'branches',
                                    model: 'Branch'
                                }
                            })
                            .populate('branchId')
                            .populate('activeAttendanceId')
                            .then((employee) => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(employee);

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
            let error = functions.errorGeneration(`Employee record with ID ${req.params.employeeId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
});

// '/employees/company/:companyId' route
employeeRouter.route('/company/:companyId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    req.query['companyId'] = req.params.companyId;

    if (req.query['hasApproval'])
        req.query['hasApproval'] = eval(req.query['hasApproval']);

    if (req.query['isActive'])
        req.query['isActive'] = eval(req.query['isActive']);

    Employee.find(req.query)
    .populate({
        path: 'companyId',
        model: 'Company',
        populate: {
            path: 'branches',
            model: 'Branch'
        }
    })
    .populate('branchId')
    .populate('activeAttendanceId')
    .sort({ empName: 1 })
    .then((employees) => {
        if (employees != null || employees.length > 0) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(employees);

        } else {
            let error = functions.errorGeneration(`Employee record(s) of company ID ${req.params.companyId} not found.`, 404);
            return next(error);
        }	
    })
    .catch((error) => next(error));
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation is not supported on /employees/company/${req.params.companyId}.`);
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`POST operation is not supported on /employees/company/${req.params.companyId}.`);
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`DELETE operation is not supported on /employees/company/${req.params.companyId}.`);
});

// '/employees/branch/:branchId' route
employeeRouter.route('/branch/:branchId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdminManager, (req, res, next) => {
    req.query['branchId'] = req.params.branchId;

    if (req.query['hasApproval'])
        req.query['hasApproval'] = eval(req.query['hasApproval']);
        
    if (req.query['isActive'])
        req.query['isActive'] = eval(req.query['isActive']);

    Employee.find(req.query)
    .populate({
        path: 'companyId',
        model: 'Company',
        populate: {
            path: 'branches',
            model: 'Branch'
        }
    })
    .populate('branchId')
    .populate('activeAttendanceId')
    .sort({ empName: 1 })
    .then((employees) => {
    	if (employees != null || employees.length > 0) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(employees);

        } else {
            let error = functions.errorGeneration(`Employee record(s) of branch ID ${req.params.branchId} not found.`, 404);
    		return next(error);
        }
    });
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation is not supported on /employees/branch/${req.params.branchId}.`);
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`POST operation is not supported on /employees/branch/${req.params.branchId}.`);
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`DELETE operation is not supported on /employees/branch/${req.params.branchId}.`);
});

// '/employees/:employeeId/reset-password' route
employeeRouter.route('/:employeeId/reset-password')
.options(cors.corsWithOptions, (req, res) => {
	res.sendStatus(200);
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdminManager, (req, res, next) => {
    Employee.findById(req.params.employeeId)
    .then((employee) => {
        if (employee != null) {
            employee.setPassword(req.body.password, () => {
                employee.save();
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    success: true,
                    message: 'Password reset successful.'
                });
            });

        } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: false,
                message: "Employee not found."
            });
        }    
    })
    .catch((error) => next(error));
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation is not supported on /employees/${req.params.employeeId}/reset-password`);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`GET operation is not supported on /employees/${req.params.employeeId}/reset-password`);
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`DELETE operation is not supported on /employees/${req.params.employeeId}/reset-password`);
});

module.exports = employeeRouter;