var moment = require('moment');

var Timesheet = function(pool) {
	this.pool = pool;
};

Timesheet.prototype.table = function(req, res, next) {
	var monthDates = createDaysObjects();
	var context = {monthDates: monthDates}
	res.render('timesheet', context);
};

Timesheet.prototype.save = function(req, res, next) {
	if(req.body) {
		console.log(req.body);
		for(var timelog in req.body) {
			console.log(req.body[timelog]);
		}
	}
	res.redirect('/timesheet');
};

function createDaysObjects() {
    var firstDayOfMonth = moment().startOf('month');
    var daysInMonth = moment().daysInMonth();

    var nextDayOfMonth = firstDayOfMonth;
    var monthDates = [];
    for (var i = 0; i < daysInMonth; i++) {
        monthDates.push(nextDayOfMonth.format('YYYY/MM/DD')); // should be configurable
        nextDayOfMonth.add(1, 'days');
    }
    return monthDates;
}

module.exports = Timesheet;