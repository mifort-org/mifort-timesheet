angular.module('mifortTimesheet.company').controller('confirmDeleteModalCtrl', function($scope, $uibModalInstance, companyName){
    $scope.companyName = companyName;

    $scope.ok = function () {
        $uibModalInstance.close(true);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});
