angular.module('registrationApp', ['ngFileUpload'])
.controller('RegistrationCtrl', ['$http', 'Upload', function ($http, Upload) {
	this.user = {};
	var ctrl = this;

	this.register = function(){
		alert(ctrl.file);
		Upload.upload({
            url: '/register',
            fields: ctrl.user,
            file: ctrl.file,
            fileFormDataName: 'myFile'
        }).progress(function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            ctrl.log = 'progress: ' + progressPercentage + '% ';
        }).success(function (data, status, headers, config) {
            ctrl.log = 'file uploaded. Response: ' + JSON.stringify(data);
        });
	};
}]);