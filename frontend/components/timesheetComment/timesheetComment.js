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
    .directive('timesheetComment', function(appVersion) {
        return {
            scope: true,
            link: function(scope, element) {
                element.find('.timesheet-comment').on('keydown', function(event) {
                    if(event.ctrlKey){
                        if(event.keyCode == 40){
                            var nextComment = $(this).parents('tr').next().find('.timesheet-comment');

                            nextComment.val($(this).val())
                                       .trigger('input')
                                       .focus();
                        }
                        else if(event.keyCode == 38){
                            var prevComment = $(this).parents('tr').prev().find('.timesheet-comment');

                            prevComment.val($(this).val())
                                .trigger('input')
                                .focus();
                        }
                    }
                });
            },
            templateUrl: 'components/timesheetComment/timesheetComment.html?rel=' + appVersion
        };
    });
