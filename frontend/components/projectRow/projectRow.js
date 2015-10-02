'use strict';

angular.module('myApp')
    .directive('projectRow', function($location) {
        return {
            scope: true,
            //transclude: 'element',
            link: function(scope, element, attr, ctrl, transclude) {
                scope.addAssignment = function(project, employee) {
                    var newEmployee = _.find(scope.companyEmployees, {displayName: employee.displayName});
                    if(newEmployee){
                        newEmployee.assignments = [{
                            projectId: project._id,
                            projectName: project.name,
                            role: '',
                            userId: newEmployee._id,
                            workload: ''
                        }];

                        project.employees.push(_.clone(newEmployee));
                        scope.saveAssignment(project, _.clone(newEmployee));
                    }

                    employee.displayName = null;
                };

            },
            templateUrl: 'components/projectRow/projectRow.html'
        };
    });