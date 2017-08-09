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
    .directive('timesheetComment',["$timeout", function($timeout) {
        var localCommentSave = {};
        var date = Date.now()/1000;
        var getLocalComment = JSON.parse(localStorage.getItem('commentSave'));

        $timeout(function () {
            if(getLocalComment){
                if(date - getLocalComment.time < 3){
                    for(var key in getLocalComment){
                        if(key.length === 1){
                            $("timesheet-comment").eq(+key).find("input").val(getLocalComment[key]);
                        }
                    }
                }
            }
        },500);
        localStorage.removeItem("commentSave");
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
                element.find('.timesheet-comment').on('input', function() {
                    var inputNumber = $(this).parents('tr').index();
                    var inputValue = $(this).val();
                    localCommentSave[inputNumber] = inputValue;
                    localCommentSave["time"]=Date.now()/1000;
                    localStorage.setItem("commentSave",JSON.stringify(localCommentSave));
                });
            },
            templateUrl: 'components/timesheetComment/timesheetComment.html'
        };
    }]);