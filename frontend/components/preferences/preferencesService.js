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

angular.module('preferences').factory('preferences', ['$q', '$location', function ($q, $location) {

    return {
        set: function (key, value) {
            localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
        },

        get: function (key) {
            var data = localStorage.getItem(key);

            if (data && typeof data === 'string' && (data[0] === '[' || data[0] === '{')) {
                data = JSON.parse(data, function(k, v) {
                    return (typeof v === "object" || isNaN(v)) ? v : parseInt(v, 10);
                });
            }

            if(key === 'user' && !data){
                $location.path('login');
            }

            return data === 'true' || (data === 'false' ? false : data);
        },

        remove: function (key) {
            localStorage.removeItem(key);
        }
    };
}]);
