var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 1313);

});

app.listen(app.get('port'), function() {
    console.log('Homogen server is started on port: ' + app.get('port'));
});