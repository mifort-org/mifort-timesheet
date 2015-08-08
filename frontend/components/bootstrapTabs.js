'use strict';

angular.module('myApp').controller('TabsDemoCtrl', function ($scope, $location) {
    $scope.tabs = [
        {title: 'timesheet'},
        {title: 'timesheetManagement'},
        {title: 'projectReport'},
        {title: 'projectManagement'},
        {title: 'peopleReport'}
    ];
    
    $scope.changeTab = function (tab) {
        tab.title;
        $location.path('/' + tab.title);
    }
});