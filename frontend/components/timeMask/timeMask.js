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
    .directive('timeMask', function () {
        return {
            scope: true,
            link: function (scope, element, attrs) {
                var input = element.find('input');
                var timePlaceholder = '';

                input.on('blur', function(){
                    var time = $(this).val();

                    if(time != ''){
                        $(this).val(time);
                    }
                    $(this).attr('placeholder', timePlaceholder);
                });

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
                });
                input.onkeypress = function(e) {
                    e = e || event;
                    if (e.ctrlKey || e.altKey || e.metaKey) return;
                    var chr = getChar(e);
                    if (chr == null) return;
                    if (chr < '0' || chr > '9') {
                        return false;
                    }
                }
            },
            templateUrl: function (element) {
                var activeTemplate;

                if(element.hasClass('timesheet-hours')){
                    activeTemplate = 'components/timeMask/timeMask.html';
                }
                else{
                    activeTemplate = 'components/timeMask/workloadMask.html';
                }

                return activeTemplate
            }
        };
    });