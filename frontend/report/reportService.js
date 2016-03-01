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

angular.module('mifortTimesheet.report').factory('reportService',
    ['$http', function($http) {
        return {
            getFilters: function(companyId) {
                return $http.get('api/v1/report/filters/' + companyId);
            },
            getReport: function(reportSettings) {
                if(reportSettings.groupBy && reportSettings.groupBy.length){
                    return $http.post('api/v1/report/aggregation', reportSettings);
                }
                else{
                    return $http.post('api/v1/report/common', reportSettings);
                }
            },
            downloadCsv: function(reportSettings) {
                return $http.post('api/v1/report/common/download', reportSettings);
            },
            downloadAggregationCsv: function(reportSettings) {
                return $http.post('api/v1/report/aggregation/download', reportSettings);
            }

        }
    }
    ]);