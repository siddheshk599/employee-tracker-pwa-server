// Module imports
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const passport = require('passport');
const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');
const debug = require('debug')('employeeTrackerPWA:server');

// File imports
const constants = require('./shared/constants');
const functions = require('./shared/functions');

// Router imports
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const employeeRouter = require('./routes/employeeRouter');
const companyRouter = require('./routes/companyRouter');
const branchRouter = require('./routes/branchRouter');
const leaveRouter = require('./routes/leaveRouter');
const attendanceRouter = require('./routes/attendanceRouter');
const chatRouter = require('./routes/chatRouter');
const salaryAdvanceRouter = require('./routes/salaryAdvanceRouter');
const analyticsRouter = require('./routes/analyticsRouter');
const geocodingRouter = require('./routes/geocodingRouter');
const imageRouter = require('./routes/imageRouter');

// Load environment variables
require("dotenv").config();

// Express app
const app = express();

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);
const socket = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  } 
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// Socket.io connection events
socket.use((connection, next) => {
  if (connection.handshake.query && connection.handshake.query.token){
    jwt.verify(connection.handshake.query.token, constants.jwtSecretKey, (error, decoded) => {
      if (error)
        return next(functions.errorGeneration('Authentication Error', 403));
      
        socket.decoded = decoded;
      next();
    });
  }
  else {
    next(functions.errorGeneration('Authentication Error', 403));
  } 
})
.on('connection', (connection) => {
  socket.emit('connection', () => {});

  connection.on('add-message', (chatMsg) => {
    socket.emit('get-message', chatMsg);
  });

  connection.on('disconnection', () => {});
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

// Connect to MongoDB
const connect = mongoose.connect(constants.mongoDbURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

connect.then((db) => {
  console.log("Connected to the MongoDB server.");
})
.catch(error => console.log('Error in connecting to the MongoDB server:', error));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json({ extended: true, limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());

app.use(express.static(path.join(__dirname, 'public')));

// Router Endpoints start
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Employee Router
app.use('/employees', employeeRouter);
app.use('/employees/:employeeId', employeeRouter);
app.use('/employees/branch/:branchId', employeeRouter);
app.use('/employees/company/:companyId', employeeRouter);
app.use('/employees/:employeeId/reset-password', employeeRouter);

// Company Router
app.use('/companies', companyRouter);
app.use('/companies/:companyId', companyRouter);
app.use('/companies/:companyId/branches', companyRouter);
app.use('/companies/:companyId/positions', companyRouter);

// Company Branch Router
app.use('/branches', branchRouter);
app.use('/branches/:branchId', branchRouter);

// Leave Router
app.use('/leaves', leaveRouter);
app.use('/leaves/:leaveId', leaveRouter);

// Attendance Router
app.use('/attendances', attendanceRouter);
app.use('/attendances/:attendanceId', attendanceRouter);
app.use('/attendances/employees/:employeeId', attendanceRouter);
app.use('/attendances/:attendanceId/location-history', attendanceRouter);

// Chat Router
app.use('/chats', chatRouter);

// Salary Advance Router
app.use('/salary-advances', salaryAdvanceRouter);
app.use('/salary-advances/:salaryAdvanceId', salaryAdvanceRouter);
app.use('/salary-advances/employee/:employeeId', salaryAdvanceRouter);

// Analytics Router
app.use('/analytics', analyticsRouter);

// Geocoding Router
app.use('/geocoding', geocodingRouter);

// Image Router
app.use('/image', imageRouter);

// Router Endpoints end

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
