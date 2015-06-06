//Dependencies
var express = require('express');
var crud = require('./api/crud');
var upload = require('./api/upload');
var bodyParser = require('body-parser');
var path = require('path');
var multiparty = require('connect-multiparty');

var app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'public')));

app.get('/', function(req, res, next) {
	res.end("Hello world!!!")
});
app.get('/api/product/:id', crud.get);
app.post('/api/product/save', crud.save);
app.post('/register', multiparty(), upload.upload);


app.listen(3000, function(){
  console.log('Express server listening on port 3000');
});