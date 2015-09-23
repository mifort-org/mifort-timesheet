'use strict';

angular.module('myApp')
    .directive('tableCell', function ($location) {
        return {
            scope: true,
            link: function (scope, element) {
                var clickableAreaWidth = 7;

                element.on('click', function (e) {
                    if(scope.day.date && $(e.target).is('td')){
                        var dayIndex,
                            dayweekIndex,
                            nextDay = scope.timesheet[dayIndex + 1],
                            previousDay = scope.timesheet[dayIndex - 1];

                        scope.timesheet.forEach(function(week, weekIndex){
                            var currentWeekDayIndex = _.findIndex(week, {date: scope.day.date});
                            if(currentWeekDayIndex != -1){
                                dayIndex = currentWeekDayIndex;
                                dayweekIndex = weekIndex;
                                nextDay = scope.timesheet[dayweekIndex][dayIndex + 1] ||
                                          scope.timesheet[dayweekIndex + 1][0] ||
                                        true;
                            }
                        });

                        //left border click
                        if (e.pageX - clickableAreaWidth < $(this).offset().left) {
                            scope.day.isPeriodStartDate = !scope.day.isPeriodStartDate;
                            if(previousDay && previousDay.date){
                                previousDay.isPeriodEndDate = !previousDay.isPeriodEndDate;
                                scope.aggregatePeriods(scope.timesheet);
                            }
                        }
                        //right border click
                        else if (e.pageX > $(this).offset().left + $(this).outerWidth() - clickableAreaWidth) {
                            scope.day.isPeriodEndDate = !scope.day.isPeriodEndDate;
                            if(nextDay && nextDay.date) {
                                nextDay.isPeriodStartDate = !nextDay.isPeriodStartDate;
                                scope.aggregatePeriods(scope.timesheet);
                            }
                        }

                        scope.$apply();
                    }
                });
            },
            templateUrl: 'components/tableCell/tableCell.html'
        };
    });