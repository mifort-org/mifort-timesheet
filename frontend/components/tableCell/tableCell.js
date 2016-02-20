/*!
 * Copyright 2015 mifort.org
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

angular.module('mifortTimesheet')
    .directive('tableCell', function () {
        return {
            scope: true,
            link: function (scope, element) {
                var clickableAreaWidth = 7;

                element.on('click', function (e) {
                    if(scope.day.date && ($(e.target).hasClass('start-splitter') || $(e.target).hasClass('end-splitter'))){
                        var dayIndex = _.findIndex(scope.calendar, scope.day);
                        var nextDay = scope.calendar[dayIndex + 1],
                            previousDay = scope.calendar[dayIndex - 1];

                        //left border click
                        if (e.pageX - clickableAreaWidth < $(this).offset().left) {
                            scope.day.isPeriodStartDate = !scope.day.isPeriodStartDate;
                            if(previousDay && previousDay.date){
                                previousDay.isPeriodEndDate = !previousDay.isPeriodEndDate;
                                scope.aggregatePeriods(scope.calendar);
                            }
                        }
                        //right border click
                        else if (e.pageX > $(this).offset().left + $(this).outerWidth() - clickableAreaWidth) {
                            scope.day.isPeriodEndDate = !scope.day.isPeriodEndDate;
                            if(nextDay && nextDay.date) {
                                nextDay.isPeriodStartDate = !nextDay.isPeriodStartDate;
                                scope.aggregatePeriods(scope.calendar);
                            }
                        }

                        scope.$apply();
                    }
                });

                scope.getDayTime = function(day) {
                    if(!day.dayId){
                        return day.time;
                    }
                    else{
                        var currentDayDayType = _.findWhere(scope.company.dayTypes, {id: day.dayId});

                        if(currentDayDayType){
                            return currentDayDayType.time;
                        }
                    }
                }
            },
            templateUrl: 'components/tableCell/tableCell.html'
        };
    });