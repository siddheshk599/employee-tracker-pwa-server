let express = require('express');
let bodyParser = require('body-parser');
let cors = require('./cors');
let functions = require('../shared/functions');
let authenticate = require('../authenticate');

let Company = require('../models/company');
let Employee = require('../models/employee');

let companyRouter = express.Router();

companyRouter.use(bodyParser.json());

// '/companies' route
companyRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    Company.find(req.query)
    .populate('branches')
    .sort({ companyName: 1 })
    .then((companies) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(companies);
    })
    .catch((error) => next(error));
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /companies.');
})
.post(cors.corsWithOptions, (req, res, next) => {
    Company.create(req.body).then((company) => {
        Company.findOne(company._id)
        .populate('branches')
        .then((company) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(company);
        })
        .catch((error) => next(error));
    })
    .catch((error) => next(error));
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('DELETE operation is not supported on /companies.');
});

// '/companies/:companyId' route
companyRouter.route('/:companyId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdminManager, (req, res, next) => {
    Company.findById(req.params.companyId)
    .populate('branches')
    .then((company) => {
        if (company != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(company);

        } else {
            let error = functions.errorGeneration(`Company record with ID ${req.params.companyId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    Company.findById(req.params.companyId)
    .then((company) => {
        if (company != null) {
            Company.findByIdAndUpdate(req.params.companyId, {
                $set: req.body
            }, { new: true })
            .populate('branches')
            .then((company) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(company);
            })
            .catch((error) => next(error));

        } else {
            let error = functions.errorGeneration(`Company record with ID ${req.params.companyId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`POST operation is not supported on /companies/${req.params.companyId}.`);
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    Company.findById(req.params.companyId)
    .then((company) => {
        if (company != null) {
            Company.findByIdAndRemove(req.params.companyId)
            .populate('branches')
            .then((company) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(company);
            })
            .catch((error) => next(error));

        } else {
            let error = functions.errorGeneration(`Company record with ID ${req.params.companyId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error))
});

// '/companies/:companyId/branches' route
companyRouter.route('/:companyId/branches')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    Company.findById(req.params.companyId)
    .populate('branches')
    .then((company) => {
        if (company != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(company);

        } else {
            let error = functions.errorGeneration(`Company record with ID ${req.params.companyId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.put(cors.corsWithOptions, (req, res, next) => {
    Company.findById(req.params.companyId)
    .then((company) => {
        if (company != null) {
            Company.findByIdAndUpdate(req.params.companyId, {
                $push: { branches: req.body.branchId }
            }, { new: true })
            .populate('branches')
            .then((company) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(company);
            })
            .catch((error) => next(error));

        } else {
            let error = functions.errorGeneration(`Company record with ID ${req.params.companyId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`POST operation is not supported on /companies/${req.params.companyId}/branches.`);
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`DELETE operation is not supported on /companies/${req.params.companyId}/branches.`);
});

// '/companies/:companyId/positions' route
companyRouter.route('/:companyId/positions')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`GET operation is not supported on /companies/${req.params.companyId}/positions.`);
})
.post(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    Company.findById(req.params.companyId)
    .then((company) => {
        if (company != null || company.length > 0) {
            company.positions.push(req.body.position);
            
            company.save().then((company) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(company.positions);
            })
            .catch((error) => next(error));

        } else {
            let error = functions.errorGeneration(`Company record with ID ${req.params.companyId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.put(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    Company.findById(req.params.companyId)
    .then((company) => {
        if (company != null || company.length > 0) {
            let oldPosition = company.positions[req.body.insertAtIndex];
            let newPosition = req.body.position;

            Employee.updateMany({ position: oldPosition }, {
                $set: { position: newPosition }
            }).then((employees) => {
                company.positions.splice(req.body.insertAtIndex, 1, newPosition);
            
                company.save().then((company) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(company.positions);
                })
                .catch((error) => next(error));
            })
            .catch((error) => next(error));

        } else {
            let error = functions.errorGeneration(`Company record with ID ${req.params.companyId} not found.`, 404);
            return next(error);
        }
    })
    .catch((error) => next(error));
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdmin, (req, res, next) => {
    if (req.query['position']) {
        Company.findById(req.params.companyId)
        .then((company) => {
            if (company != null || company.length > 0) {
                company.positions.splice(company.positions.indexOf(req.query['position']), 1);
                
                company.save().then((company) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(company.positions);
                })
                .catch((error) => next(error));

            } else {
                let error = functions.errorGeneration(`Company record with ID ${req.params.companyId} not found.`, 404);
                return next(error);
            }
        })
        .catch((error) => next(error));

    } else {
        let error = functions.errorGeneration(`Name of the position to delete is not specified.`, 404);
        return next(error)
    }
});

module.exports = companyRouter;