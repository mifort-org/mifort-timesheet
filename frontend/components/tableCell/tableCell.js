'use strict';

angular.module('myApp')
    .directive('tableCell', function($location) {
        return {
            scope: true,
            link: function (scope, element) {
                var parentScope = scope.$parent,
                    weekIndex = parentScope.$parent,
                    dayIndex = parentScope.$index;

                element.on('click', function (e) {
                    //left border was clicked
                    if(e.pageX - 12 < $(this).offset().left){
                        scope.day.isPeriodStartDate = !scope.day.isPeriodStartDate;
                        scope.periodTimeChanged(scope.day, weekIndex, dayIndex);
                    }
                    //right border was clicked
                    else if(e.pageX > $(this).offset().left + $(this).outerWidth() - 12){
                        scope.day.isPeriodEndDate = !scope.day.isPeriodEndDate;
                        scope.periodTimeChanged(scope.day, weekIndex, dayIndex);
                    }
                    scope.$apply();
                });


            },
            templateUrl: 'components/tableCell/tableCell.html'
        };
    });