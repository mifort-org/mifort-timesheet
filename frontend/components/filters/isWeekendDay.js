angular.module('myApp').filter('isWeekendDay', function() {
    return function(date) {
        var day = new Date(date).getDay();
        return (day == 6) || (day == 0);
    }
});