var express = require('express');
var cors = require('./cors');
var passport = require('passport');
var authenticate = require('../authenticate');
const Employees = require('../models/employee');

var router = express.Router();

router.options('*', cors.corsWithOptions, (req, res) => {
  res.sendStatus(200);
});

router.get('/', cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyAdmin, function(req, res, next) {
  Employees.find({})
  .populate({
    path: 'companyId',
    model: 'Company',
    populate: {
      path: 'branches',
      model: 'Branch'
    }
  })
  .populate('branchId')
  .populate('activeLeaveId')
  .then((employees) => {
    res.status = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(employees);
  })
  .catch((error) => next(error));
});

router.post('/register', cors.corsWithOptions, (req, res, next) => {
  Employees.register(new Employees({
    companyId: req.body.companyId,
    branchId: req.body.branchId,
    position: req.body.position,
    empId: req.body.empId,
    empName: req.body.empName,
    mobileNumber: req.body.mobileNumber,
    workingDays: req.body.workingDays,
    inTime: req.body.inTime,
    outTime: req.body.outTime,
    canPunchInOutAnywhere: req.body.canPunchInOutAnywhere,
    salaryType: req.body.salaryType,
    salaryAmount: req.body.salaryAmount,
    joiningDate: req.body.joiningDate,
    emailId: req.body.emailId,
    dob: req.body.dob,
    address: req.body.address,
    bankAccNo: req.body.bankAccNo,
    bankIfsc: req.body.bankIfsc,
    aadhaar: req.body.aadhaar,
    pan: req.body.pan,
    username: req.body.username,
    isActive: req.body.isActive,
    hasApproval: req.body.hasApproval,
    photoImg: req.body.photoImg,
    nextPossiblePunchIn: req.body.nextPossiblePunchIn
}), req.body.password, (error, employee) => {
    if (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({ error: error });
    } else {
      employee.save((error, employee) => {
        if (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({ error: error });
            return;
        }
        passport.authenticate('local', {
          session: false
        })(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({
              status: 'Employee added successfully.',
              success: true
          });
        });
     });
    }
  });
});

router.post('/login', cors.corsWithOptions, (req, res, next) => {
  
  passport.authenticate('local', {
    session: false
  }, (error, user, info) => {
    if (error) return next(error);
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.json({ success: false, status: 'Login unsuccessful!', error: info });
      return;
    }

    req.logIn(user, {
      session: false
    }, (error) => {
      if (error) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({ success: false, status: 'Login unsuccessful!', error: 'Could not login user.' });
      } else {
        var token = authenticate.getToken({ _id: req.user._id });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({ success: true, status: 'Login successful!', token: token });
      }
    });

  }) (req, res, next);
});

router.get('/checkJwtToken', cors.corsWithOptions, (req, res, next) => {
  passport.authenticate('jwt', {
    session: false
  }, (error, user, info) => {
    if (error) return next(error);
    
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.json({ status: "JWT invalid.", success: false, error: info });
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.json({ status: "JWT valid.", success: true, user: info });
    }
  }) (req, res);
});

module.exports = router;
