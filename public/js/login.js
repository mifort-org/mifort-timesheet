angular.module('app', [])
.service('loginService', ['$http', function($http) {
    this.canGrandAccess = function(user, callback) {
        $http.post('/api/authenticate', user).success(function(data) {
            callback(data);
        });
    };
}])
.controller('LoginCtrl', ['loginService', function(loginService) {
	this.user = {};
}]);