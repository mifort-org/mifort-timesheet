var moment = require('moment');

exports.table = function(req, res, next) {
	var monthDates = createDaysObjects();
	var context = {monthDates: monthDates}
	res.render('timesheet', context);
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