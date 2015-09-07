'use strict';

angular.module('myApp')
    .directive('tableCell', function ($location) {
        return {
            scope: true,
            link: function (scope, element) {
                var parentScope = scope.$parent;

                element.on('click', function (e) {
                    var dayIndex = _.findIndex(scope.timesheet, scope.day);
                    var nextDay = scope.timesheet[dayIndex + 1],
                        previousDay = scope.timesheet[dayIndex - 1];

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

                    scope.periodTimeChanged(scope.day, dayIndex);
                    scope.$apply();
                });
            },
            templateUrl: 'components/tableCell/tableCell.html'
        };
    });