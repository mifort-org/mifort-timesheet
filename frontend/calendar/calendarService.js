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

angular.module('mifortTimesheet.calendar').factory('calendarService',
    ['$http', function($http) {
        return {
            getCompany: function(companyId) {
                return $http.get('api/v1/company/' + companyId);
            },
            saveCompany: function(parameters) {
                return $http.post('api/v1/company', parameters);
            },
            getPeriodSettings: function() {
                return [
                    'Week',
                    'Month'
                ]
            },
            getCountPeriodSettings: function() {
                return [
                    {count: 1},
                    {count: 2},
                    {count: 3},
                    {count: 4},
                    {count: 5}
                ]
            },
            getWeekDays: function() {
                return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
            }
            
        };
    }
    ]);
