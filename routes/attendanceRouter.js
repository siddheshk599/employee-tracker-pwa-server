let express = require('express');
let bodyParser = require('body-parser');
let functions = require('../shared/functions');
let cors = require('./cors');
let authenticate = require('../authenticate');

let Employee = require('../models/employee');
let Attendance = require('../models/attendance');

let attendanceRouter = express.Router();

attendanceRouter.use(bodyParser.json());

// '/attendances' route
attendanceRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdminManager, (req, res, next) => {

    if (req.query['admin'] || req.query['branchId'] || req.query['companyId']) {
        let employeeQuery = {
            isActive: true,
            hasApproval: true
        };

        if (req.query['branchId']) {
            employeeQuery['branchId'] = req.query['branchId'];
            employeeQuery['position'] = {
                $nin: ['admin', 'company_admin', 'branch_manager']
            }
            
        } else if (req.query['companyId']) {
            employeeQuery['companyId'] = req.query['companyId'];
            employeeQuery['position'] = {
                $nin: ['admin', 'company_admin']
            }
        }
        
        if (req.query['dataFormat'] == 'dates') {
            Employee.find(employeeQuery)
            .sort({ createdAt: 1 })
            .then((employees) => {
                if (employees != null || employees.length > 0) {
                    let attendanceDates =  [...functions.getReportDatesOrMonths(
                        'dates',
                        new Date(employees[0].createdAt),
                        new Date()
                    )];
    
                    functions.sendJSONResponse(res, attendanceDates);
                } else {
                    let error = functions.errorGeneration(`Employee record(s) for specified query not found.`, 404);
                    return next(error);
                }
            })
            .catch((error) => next(error));

        } else if (req.query['startDate'] && req.query['endDate']) {   
            let startDateString = decodeURIComponent(req.query['startDate']);
            let endDateString = decodeURIComponent(req.query['endDate']);

            employeeQuery['createdAt'] = {
                $lte: startDateString,
                $lte: endDateString
            };

            Employee.find(employeeQuery)
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
                    let startDate = new Date(startDateString);

                    let employeeIds = [...employees.map((emp) => emp._id.toString())];

                    Attendance.find({ 
                        empId: { $in: employeeIds },
                        inTime: {
                            $gte: startDateString,
                            $lte: endDateString
                        }
                    })
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
                    .then((attendances) => {
                        let attendanceEmpIds = [...attendances.map((attendance) => attendance.empId._id.toString())];

                        attendanceEmpIds.forEach((attendanceEmpId) => {
                            let idIndex = employeeIds.indexOf(attendanceEmpId);

                            if (idIndex != -1) {
                                employeeIds.splice(idIndex, 1);
                                employees.splice(idIndex, 1);
                            }
                        });

                        employeeIds.forEach((empId, idx) => {
                            let record = {
                                empId: employees[idx],
                                inTime: startDateString,
                                outTime: endDateString,
                                punchInImg: '',
                                punchInLocation: employees[idx].branchId['branchLocation'],
                                punchOutImg: '',
                                punchOutLocation: employees[idx].branchId['branchLocation'],
                                punchInDoneBy: employees[idx],
                                punchOutDoneBy: employees[idx],
                                status: (
                                    (functions.isWorkingDay(startDate, employees[idx])) ? 'absent' : 'holiday'
                                ),
                                locationHistory: []
                            };

                            attendances.push(record);
                        });

                        attendances.sort((att1, att2) => {
                            if (att1.empId.empName < att2.empId.empName)
                                return -1;
                            else if (att1.empId.empName > att2.empId.empName)
                                return 1;
                            else
                                return 0;
                        });

                        functions.sendJSONResponse(res, attendances);
                    })
                    .catch((error) => next(error));

                } else {
                    let error = functions.errorGeneration(`Employee record(s) for specified query not found.`, 404);
                    return next(error);
                }
            })
            .catch((error) => next(error));
        }

    } else {
        Attendance.find(req.query)
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
        .sort({ inTime: 1 })
        .then((attendances) => {
            if (attendances != null || attendances.length > 0) {
                functions.sendJSONResponse(res, attendances);

            } else {
                let error = functions.errorGeneration(`Attendance record(s) not found.`, 404);
                return next(error);
            }
        })
        .catch((error) => next(error));
    }
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation is not supported on /attendances.`);
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
   Attendance.create(req.body)
   .then((result) => {
       Attendance.findById(result._id)
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
        .then((attendance) => {
            functions.sendJSONResponse(res, attendance);
        })
        .catch((error) => next(error)); 
   })
   .catch((error) => next(error));
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    Attendance.deleteMany(req.query)
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
    .sort({ inTime: 1 })
    .then((attendances) => {
        functions.sendJSONResponse(res, attendances);
    })
    .catch((error) => next(error));
});

// '/attendances/:attendanceId' route
attendanceRouter.route('/:attendanceId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
	Attendance.findById(req.params.attendanceId)
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
    .then((attendances) => {
        if (attendances != null) {
            functions.sendJSONResponse(res, attendances);

        } else {
            let error = functions.errorGeneration(`Attendance record with ID ${req.params.attendanceId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
    Attendance.findById(req.params.attendanceId)
    .then((result) => {
        if (result != null) {
            Attendance.findByIdAndUpdate(req.params.attendanceId, {
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
            .then((attendance) => {
                functions.sendJSONResponse(res, attendance);
            })
            .catch((error) => next(error));

        } else {
            let error = functions.errorGeneration(`Attendance record with ID ${req.params.attendanceId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`POST operation is not supported on /attendances/${req.params.attendanceId}.`);
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdminManager, (req, res, next) => {
    Attendance.findById(req.params.attendanceId)
    .then((result) => {
        if (result != null) {
            Attendance.findByIdAndRemove(req.params.attendanceId)
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
            .then((attendance) => {
                functions.sendJSONResponse(res, attendance);
            })
            .catch((error) => next(error));
        } else {
            let error = functions.errorGeneration(`Attendance record with ID ${req.params.attendanceId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
});

// '/attendances/employees/:employeeId' route
attendanceRouter.route('/employees/:employeeId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
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
            if (req.query['dataFormat'] == 'months') {
                let attendanceMonths = [...functions.getReportDatesOrMonths(
                    'months',
                    new Date(employee.createdAt),
                    new Date()
                )];

                functions.sendJSONResponse(res, attendanceMonths);

            } else if (req.query['startDate'] && req.query['endDate']) {
                let startDateString = decodeURIComponent(req.query['startDate']);
                let endDateString = decodeURIComponent(req.query['endDate']);
                
                Attendance.find({
                    empId: req.params.employeeId,
                    inTime: {
                        $gte: startDateString,
                        $lte: endDateString
                    }
                })
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
                .sort({ inTime: 1 })
                .then((attendances) => {
                    let attendancePadding = (req.query['attendancePadding']) ? eval(req.query['attendancePadding']) : false;

                    if (attendancePadding) {
                        attendances = [...functions.getAttendancesForSpecificPeriod(
                            employee,
                            attendances,
                            decodeURIComponent(req.query['startDate']),
                            decodeURIComponent(req.query['endDate'])
                        )];
                    }
    
                    functions.sendJSONResponse(res, attendances);
                })
                .catch((error) => next(error));
            }

        } else {
            let error = functions.errorGeneration(`Employee record with ID ${req.params.employeeId} not found`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation is not supported on /attendances/employees/${req.params.employeeId}.`);
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`POST operation is not supported on /attendances/employees/${req.params.employeeId}.`);
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`DELETE operation is not supported on /attendances/employees/${req.params.employeeId}.`);
});

// '/attendances/:attendanceId/location-history' route
attendanceRouter.route('/:attendanceId/location-history')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    Attendance.findById(req.params.attendanceId)
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
    .then((attendance) => {
        if (attendance != null) {
            functions.sendJSONResponse(res, attendance.locationHistory);

        } else {
            let error = functions.errorGeneration(`Attendance record with ID ${req.params.attendanceId} not found.`, 404);
			return next(error);
        }
    })
    .catch((error) => next(error));
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
    Attendance.findById(req.params.attendanceId)
    .then((attendance) => {
        if (attendance != null) {
            Attendance.findByIdAndUpdate(req.params.attendanceId, {
                $push: { locationHistory: req.body }
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
            .then((attendance) => {
                functions.sendJSONResponse(res, attendance);
            })
            .catch((error) => next(error));
        } else {
            let error = functions.errorGeneration(`Attendance record with ID ${req.params.attendanceId} not found.`, 404);
			return next(error);
        }
    })
    .catch((error) => next(error));
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`POST operation is not supported on /attendances/location-history/${req.params.attendanceId}.`);
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`DELETE operation is not supported on /attendances/location-history/${req.params.attendanceId}.`);
})

module.exports = attendanceRouter;