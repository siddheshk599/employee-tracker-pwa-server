let express = require('express');
let bodyParser = require('body-parser');
let cors = require('./cors');
let authenticate = require('../authenticate');
let functions = require('../shared/functions');

let SalaryAdvance = require('../models/salaryAdvance');

let salaryAdvanceRouter = express.Router();

salaryAdvanceRouter.use(bodyParser.json());

// '/salary-advances' route
salaryAdvanceRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdminManager, (req, res, next) => {
    SalaryAdvance.find(req.query)
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
    .sort({ advanceDate: 1 })
    .then((salaryAdvances) => {
        if (salaryAdvances != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(salaryAdvances);
        } else {
            let error = new functions.errorGeneration(`No salary advance records with the specified criteria exist.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
    SalaryAdvance.create(req.body)
    .then((salaryAdvance) => {
        SalaryAdvance.findById(salaryAdvance._id)
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
        .then((salaryAdvance) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(salaryAdvance);
        })
        .catch((error) => next(error));
    })
    .catch((error) => next(error));
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /salary-advances.');
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('DELETE operation is not supported on /salary-advances.');
});

// '/salary-advances/:salaryAdvanceId' route
salaryAdvanceRouter.route('/:salaryAdvanceId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    SalaryAdvance.findById(req.params.salaryAdvanceId)
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
    .then((salaryAdvance) => {
        if (salaryAdvance != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(salaryAdvance);

        } else {
            let error = new functions.errorGeneration(`Salary Advance record with ID ${req.params.salaryAdvanceId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
    res.statusCode = 403;
    res.end(`POST operation is not supported on /salary-advances/${req.params.salaryAdvanceId}.`);
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdminManager, (req, res, next) => {
    SalaryAdvance.findById(req.params.salaryAdvanceId)
    .then((salaryAdvance) => {
        if (salaryAdvance != null) {
            SalaryAdvance.findByIdAndUpdate(req.params.salaryAdvanceId, {
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
            .then((salaryAdvance) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(salaryAdvance);
            })
            .catch((error) => next(error));

        } else {
            let error = new functions.errorGeneration(`Salary Advance record with ID ${req.params.salaryAdvanceId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`DELETE operation is not supported on /salary-advances/${req.params.salaryAdvanceId}.`);
});

// '/salary-advances/employee/:employeeId' route
salaryAdvanceRouter.route('/employee/:employeeId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
    req.query['empId'] = req.params.employeeId;

    if (req.query['startDate'] && req.query['endDate']) {
        let startDateString = decodeURIComponent(req.query['startDate']);
        let endDateString = decodeURIComponent(req.query['endDate']);

        delete req.query['startDate'];
        delete req.query['endDate'];

        req.query['advanceDate'] = {
            $gte: startDateString,
            $lte: endDateString
        };
    }

	SalaryAdvance.find(req.query)
	.then((salaryAdvances) => {
		if (salaryAdvances != null) {
            SalaryAdvance.find(req.query)
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
            .sort({ advanceDate: 1 })
            .then((salaryAdvances) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(salaryAdvances);
            })
            .catch((error) => next(error));

		} else {
			let error = functions.errorGeneration(`Salary Advance record(s) for employee ID ${req.params.employeeId} not found.`, 404);
			return next(error);
		}	
	})
	.catch((error) => next(error));
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation is not supported on /salary-advances/employee/${req.params.employeeId}.`);
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`POST operation is not supported on /salary-advances/employee/${req.params.employeeId}.`);
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`DELETE operation is not supported on /salary-advances/employee/${req.params.employeeId}.`);
});

module.exports = salaryAdvanceRouter;