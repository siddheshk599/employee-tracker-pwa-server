const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Employee = require('./models/employee');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');

const constants = require('./shared/constants');

exports.local = passport.use(new LocalStrategy(Employee.authenticate()));
passport.serializeUser(Employee.serializeUser());
passport.deserializeUser(Employee.deserializeUser());

exports.getToken = (user) => {
    return jwt.sign(user, constants.jwtSecretKey, {
        expiresIn: "2 days"
    });
}

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = constants.jwtSecretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    Employee.findOne({ _id: jwt_payload._id }, (error, user) => {
        if (error)
            return done(error, false);
        else if (user)
            return done(null, user);
        else
            return done(null, false);
    });
}));

exports.verifyEmployee = passport.authenticate('jwt', {
    session: false
});

exports.verifyAdmin = (req, res, next) => {
    if (this.verifyEmployee) {
        if (req.user.position == "admin") {
            return next();
        } else {
            var error = new Error('You are not authorized to perform this operation.');
            error.status = 403;
            return next(error);
        }
    }
};

exports.verifyEitherAdmin = (req, res, next) => {
    if (this.verifyEmployee) {
        if (req.user.position == "company_admin" || req.user.position == "admin") {
            return next();
        } else {
            var error = new Error('You are not authorized to perform this operation.');
            error.status = 403;
            return next(error);
        }
    }
};

exports.verifyEitherAdminManager = (req, res, next) => {
    if (this.verifyEmployee) {
        if (req.user.position == "company_admin" || req.user.position == "admin" || req.user.position == "branch_manager") {
            return next();
        } else {
            var error = new Error('You are not authorized to perform this operation.');
            error.status = 403;
            return next(error);
        }
    }
};