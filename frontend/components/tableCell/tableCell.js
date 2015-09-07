'use strict';

angular.module('myApp')
    .directive('tableCell', function ($location) {
        return {
            scope: true,
            link: function (scope, element) {
                var parentScope = scope.$parent;

                element.on('click', function (e) {
                    var dayIndex = _.findIndex(scope.week, scope.day);
                    var weekIndex = _.findIndex(scope.splittedTimesheet, scope.week),
                        nextDay,
                        previousDay;

                    if (scope.week[dayIndex + 1]) {
                        nextDay = scope.week[dayIndex + 1];
                    }
                    else if (scope.splittedTimesheet[weekIndex + 1]) {
                        nextDay = scope.splittedTimesheet[weekIndex + 1][0];
                    }
                    if (scope.week[dayIndex - 1]) {
                        previousDay = scope.week[dayIndex - 1];
                    }
                    else if (scope.splittedTimesheet[weekIndex - 1]) {
                        previousDay = scope.splittedTimesheet[weekIndex - 1][0];
                    }

                    //left border click
                    if (e.pageX - 12 < $(this).offset().left) {
                        scope.day.isPeriodStartDate = !scope.day.isPeriodStartDate;
                        previousDay.isPeriodEndDate = !previousDay.isPeriodEndDate;
                    }
                    //right border click
                    else if (e.pageX > $(this).offset().left + $(this).outerWidth() - 12) {
                        scope.day.isPeriodEndDate = !scope.day.isPeriodEndDate;
                        nextDay.isPeriodStartDate = !nextDay.isPeriodStartDate;
                    }

                    scope.periodTimeChanged(scope.day, weekIndex, dayIndex);
                    scope.$apply();
                });
            },
            templateUrl: 'components/tableCell/tableCell.html'
        };
    });