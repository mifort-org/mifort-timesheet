'use strict';

angular.module('myApp')
    .directive('projectRow', function($location) {
        return {
            scope: true,
            //transclude: 'element',
            link: function(scope, element, attr, ctrl, transclude) {
                scope.addAssignment = function(project, newEmployee) {

                    newEmployee = _.find(scope.companyEmployees, {displayName: newEmployee.displayName});
                    newEmployee.assignments = [{
                        projectId: project._id,
                        projectName: project.name,
                        role: '',
                        userId: newEmployee._id,
                        workload: ''
                    }];

                    project.employees.push(_.clone(newEmployee));
                    scope.saveAssignment(project, _.clone(newEmployee));
                    newEmployee.displayName = '123';
                };

            },
            templateUrl: 'components/projectRow/projectRow.html'
        };
    });