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
angular.module('mifortTimesheet.login', ['ngRoute', 'constants'])

    .config(['$routeProvider', 'appVersion', function ($routeProvider, appVersion) {
        $routeProvider.when('/login', {
            templateUrl: 'login/loginView.html?rel=' + appVersion,
            controller: 'loginController'
        });
    }])

    .controller('loginController', ['$scope', '$location', 'loginService', 'preferences', '$rootScope', function ($scope, $location, loginService, preferences, $rootScope) {
        $rootScope.isLoggedIn = false;

        $scope.user = loginService.getUser().success(function (data) {
            if(data){
                preferences.set('user', data);

                if(data.companyId){
                    $rootScope.companyId = data.companyId;
                    $location.path('/timesheet');
                }
                else{
                    $location.path('/company-create');
                }

                $rootScope.isLoggedIn = true;
            }
        }).error(function() {
            $rootScope.isNotLoggedIn = true;
        });

        $scope.googleLogin = function(){
            window.location ='/googlelogin';
        };

        $scope.login = function () {
            $location.path('/timesheet');
            $rootScope.isLoggedIn = true;
        };
    }]);
