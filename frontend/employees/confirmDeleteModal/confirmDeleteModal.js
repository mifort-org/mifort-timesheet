angular.module('mifortTimesheet.employees').controller('confirmDeleteEmployeeModal', function($scope, $uibModalInstance, employeeName){
    $scope.employeeName = employeeName;

    $scope.ok = function () {
        $uibModalInstance.close(true);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});
