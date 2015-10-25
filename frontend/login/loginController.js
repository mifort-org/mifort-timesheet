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

angular.module('myApp.login', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/login', {
            templateUrl: 'login/loginView.html',
            controller: 'loginController'
        });
    }])

    .controller('loginController', ['$scope', '$location', 'loginService', '$cookies', 'preferences', function ($scope, $location, loginService, $cookies, preferences) {
        $scope.$parent.isLoggedIn = false;
        $scope.user = loginService.getUser().success(function (data) {
            if(data){
                $cookies.put('user', JSON.stringify(data));
                preferences.set('user', data);
                $scope.$parent.isLoggedIn = true;
                $location.path('/Timelog');
            }
        });

        $scope.login = function () {
            $scope.$parent.isLoggedIn = true;
            $location.path('/Timelog');
        };
    }]);