'use strict';

angular.module('myApp').controller('TabsController', function ($scope, $location) {
    $scope.tabs = [
        {title: 'timelog'},
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

angular.module('myApp')
    .directive('bootstrapTabs', function() {
        return {
            link: function (scope, $location) {
                scope.tabs = [
                    {title: 'timelog'},
                    {title: 'timesheetManagement'},
                    {title: 'projectReport'},
                    {title: 'projectManagement'},
                    {title: 'peopleReport'}
                ];

                scope.changeTab = function (tab) {
                    tab.title;
                    $location.path('/' + tab.title);
                }
            },
            templateUrl: 'components/tabs/bootstrapTabs.html'
        };
    });