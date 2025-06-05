const constants = require('./constants');

let functions = {
    errorGeneration: (errorMsg, errorCode) => {
        let error = new Error(errorMsg);
        error.status = errorCode;
        return error;
    },
    sendJSONResponse: (response, data) => {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json');
        response.json(data);
    },
    isWorkingDay: (date, employee) => {
        let hasWorkingDay = false;
        let days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        let dayIndex = date.getDay();
        hasWorkingDay = (employee['workingDays'].indexOf(days[dayIndex]) >= 0) ? true : false;

        return hasWorkingDay;
    },
    getReportDatesOrMonths: (mode, startDate, endDate) => {
        let attendanceMonths = [];
        let attendanceDates = [];
        let months = constants.months;
            
        startDate.setUTCHours(0);
        startDate.setUTCMinutes(0);
        startDate.setUTCSeconds(0);
        startDate.setUTCMilliseconds(0);
    
        endDate.setHours(23);
        endDate.setMinutes(59);
        endDate.setSeconds(0);
        endDate.setMilliseconds(0);
        
        while (startDate.getTime() <= endDate.getTime()) {
            if (mode == 'dates') {
                let currentDate = `${startDate.toISOString().split('T')[0]}T00:00:00.000Z`;

                if (attendanceDates.map((elem) => elem.startDate).indexOf(currentDate) == -1) {
                    let lastDate = new Date(currentDate);

                    lastDate.setHours(23);
                    lastDate.setMinutes(59);
                    lastDate.setSeconds(0);
                    lastDate.setMilliseconds(0);

                    attendanceDates.push({
                        startDate: currentDate,
                        endDate: lastDate.toISOString()
                    });
                }

            } else if (mode == 'months') {
                let monthName = `${months[startDate.getUTCMonth()].toUpperCase()} ${startDate.getUTCFullYear()}`;
        
                if (attendanceMonths.map((elem) => elem.monthAndYear).indexOf(monthName) == -1) {
                    attendanceMonths.push({
                        monthAndYear: monthName,
                        startDate: startDate.toISOString()
                    });
                }
            }
            
            startDate.setUTCDate(startDate.getUTCDate() + 1);
        }

        if (mode == 'months') {
            attendanceMonths = [...attendanceMonths.map((elem) => {
                let endDate = new Date(elem.startDate);
                
                endDate.setUTCMonth(endDate.getUTCMonth() + 1);
                endDate.setUTCDate(0);
                endDate.setHours(23);
                endDate.setMinutes(59);
                endDate.setSeconds(59);
                endDate.setMilliseconds(0);
        
                elem['endDate'] = (
                    endDate.getTime() <= new Date().getTime()
                ) ? endDate.toISOString() : new Date().toISOString();
        
                return elem;
            })];
        }

        return (mode == 'dates') ? attendanceDates : attendanceMonths;
    },
    generateAndAddAttendanceRecord: (mode, attendances, employee, date, index) => {
        let record = {
            empId: employee,
            inTime: `${date}T${employee.inTime.toISOString().split('T')[1]}`,
            outTime:`${date}T${employee.outTime.toISOString().split('T')[1]}`,
            punchInImg: '',
            punchInLocation: employee.branchId['branchLocation'],
            punchOutImg: '',
            punchOutLocation: employee.branchId['branchLocation'],
            punchInDoneBy: employee,
            punchOutDoneBy: employee,
            status: (
                (
                functions.isWorkingDay(new Date(
                    `${date}T${new Date(employee.inTime).toISOString().split('T')[1]}`
                ), employee)
                ) ? 'absent' : 'holiday'
            ),
            locationHistory: []
        };
        
        (mode == 'push') ? attendances.push(record) : attendances.splice(index, 0, record);

        return attendances;
    },
    getAttendancesForSpecificPeriod: (employee, attendances, firstDate, lastDate) => {
        let startDate = new Date(firstDate);
        let endDate = new Date(lastDate);

        startDate.setUTCHours(0);
        startDate.setUTCMinutes(0);
        startDate.setUTCSeconds(0);
        startDate.setUTCMilliseconds(0);

        endDate.setHours(23);
        endDate.setMinutes(59);
        endDate.setSeconds(0);
        endDate.setMilliseconds(0);

        endDate.setUTCMinutes(endDate.getUTCMinutes() - endDate.getTimezoneOffset());

        if (attendances.length == 0) {
            while (startDate.getTime() <= endDate.getTime()) {
                attendances = [...functions.generateAndAddAttendanceRecord(
                    'push', attendances, employee,
                    startDate.toISOString().split('T')[0],
                    0
                )];
    
                startDate.setUTCDate(startDate.getUTCDate() + 1);
            }

        } else if (attendances.length > 0) {
            let attendanceDates = [...attendances.map((attendance) => new Date(attendance.inTime).toISOString().split('T')[0])];

            while (startDate.getTime() <= endDate.getTime()) {
                let currentDate = startDate.toISOString().split('T')[0];

                if (attendanceDates.indexOf(currentDate) == -1) {
                    attendances = [...functions.generateAndAddAttendanceRecord('push', attendances, employee, currentDate, 0)];
                }
    
                startDate.setUTCDate(startDate.getUTCDate() + 1);
            }
        }

        attendances = [...attendances.sort((att1, att2) => {
            let att1Date = new Date(att1.inTime);
            let att2Date = new Date(att2.inTime);
  
            if (att1Date.getTime() < att2Date.getTime())
              return -1;
            else if (att1Date.getTime() > att2Date.getTime())
              return 1;
            else
              return 0;
        })];

        return attendances;
    }
};

module.exports = functions;