/*!
 * Copyright 2015 mifort.org
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Andrew Voitov
 */

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var expressValidator = require('express-validator');
var compression = require('compression');

var router = require('./backend/router');
var authentication = require('./backend/libs/authentication');
var util = require('./backend/libs/utils');
var validators = require('./backend/libs/validators');
var log = require('./backend/libs/logger');
var errorHandler = require('./backend/libs/error_handler');
var db = require('./backend/libs/mongodb_settings');

var app = express();
app.set('port', process.env.PORT || 1313);
app.set('json replacer', util.jsonStringify);

if (app.get('env') === 'production') {
    log.info('Production Mode!!!');
} else {
    log.info('Development Mode!!!');
}

app.use(cookieParser());
app.use(compression());
app.use(express.static('frontend'));
app.use(bodyParser.json({reviver:util.jsonParse}));
log.info('Static resources are initialized!');

app.use(expressValidator(validators.config));

app.use(session(
    { secret: 'homogen cat' ,
    name: 'kaas',
    cookie: { maxAge : 3600000 },
    resave: false,
    rolling: true,
    saveUninitialized: true,
    store: new MongoStore({url: db.sessionMongoUrl})})
);
//last step: init auth
authentication.init(app);

//add auth.ensureAuthenticated for each Rest API
app.use('/api', function(req, res, next){
    authentication.ensureAuthenticated(req, res, next);
});

//routing
app.use('/api/v1', router.versionRouter);

//Angular html5Mode support. Shoud be the last HTTP call
app.get('/*', function(req, res, next) {
    res.sendFile('frontend/index.html', { root: __dirname });
});

log.info('REST API is ready!');

// default error handler
app.use(errorHandler);
log.info('Error handler is initialized!');

//email send example
//var mail = require('./backend/libs/mail');
//mail.sendInvite('andreivoitau@gmail.com', 'blablabla');

//run application
app.listen(app.get('port'), function() {
    log.info('MiTimesheet server is started on port: %d', app.get('port'));
});
