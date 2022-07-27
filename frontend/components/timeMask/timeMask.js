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
    .directive('timeMask', function (appVersion, Notification) {
        return {
            link: function (scope, element, attrs) {
                var input = element.find('input');
                var timePlaceholder = '';
                var hoursInput = element.find('.timesheet-hours');

                input.on('blur', function(){
                    var time = Number($(this).val()).toFixed(2);
                    if(time != 0.00){
                        $(this).val(time);
                    }
                    $(this).attr('placeholder', timePlaceholder);
                });

                input.on("input", function () {
                    var splitVal = $(this).val().split(".");
                    if (splitVal.length === 2) {
                        var v = $(this).val();
                        var l = splitVal[1].length;
                        if (l > 2) {
                            $(this).val(v.substring(0, v.length - 1));
                        }
                    }
                });

                scope.onChangeDayHours = function(){
                    var currentDate = scope.$parent.log.date,
                        dailyHours = scope.$parent.$parent.filteredLogs,
                        hour = 0;

                    dailyHours.forEach(function (dailyHour){
                        if (dailyHour.date == currentDate) {
                            hour += +dailyHour.time;
                        }
                    });

                    if (hour > 8 && hour <= 16){
                        Notification({
                                message: 'You filled more than 8h per day',
                                delay: 4000
                            }, 'minor-warning'
                        );
                    }
                    else if (hour > 16 && hour <= 24){
                        Notification({
                                message: 'You filled more than 16h per day',
                                delay: 4000
                            }, 'warning'
                        );
                    }
                    else if (hour > 24){
                        Notification({
                                message: 'You filled more than 24h per day',
                                delay: null
                            }, 'error'
                        );
                    }
                    scope.$parent.$parent.updateTimelog(scope.$parent.log);
                };

                input.on('focus', function(){
                    var time = $(this).val();

                    if(time != '' && time.slice(-1) == 'h'){
                        $(this).val(time.slice(0, -1));
                    }
                    timePlaceholder = $(this).attr('placeholder');
                    $(this).removeAttr("placeholder");
                });

                input.on('keypress', function (event) {
                    var indexOfDot = $(this).val().indexOf(".");
                    if (event.which != 8 &&
                        (event.key != '.' && isNaN(String.fromCharCode(event.which))) ||
                        (indexOfDot > -1 && event.key == '.')) {
                        event.preventDefault(); //stop character from entering input
                    }
                    if (event.keyCode==32) {
                        return false;
                    }
                });
                hoursInput.on('input',function(event) {
                   if(+$(this).val() < 0) {
                       scope.log.time = '';
                       $(this).val('');
                   }
                });
            },
            templateUrl: function (element) {
                var activeTemplate;

                if(element.hasClass('timesheet-hours')){
                    activeTemplate = 'components/timeMask/timeMask.html?rel=' + appVersion;
                }
                else{
                    activeTemplate = 'components/timeMask/workloadMask.html?rel=' + appVersion;
                }

                return activeTemplate
            }
        };
    });
