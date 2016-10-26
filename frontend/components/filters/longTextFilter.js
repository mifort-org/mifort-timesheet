
angular.module('mifortTimesheet')
    .filter('longTextFilter', function(){

    return function(s, limit){
        var dots = "...";
        if(s.length > limit)
        {
            // you can also use substr instead of substring
            s = s.substring(0,limit) + dots;
        }

        return s;
    };
});