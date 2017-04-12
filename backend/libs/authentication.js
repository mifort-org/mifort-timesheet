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

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var ObjectID = require('mongodb').ObjectID;
var log = require('./logger');

var users = require('../user');
var registration = require('./registration');
var constants = require('./config_constants');

var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET";
var GOOGLE_CALLBACK = process.env.GOOGLE_CALLBACK || 'http://127.0.0.1:1313/oauth2callback';

var loginRedirect = '/';

passport.serializeUser(function(user, done)  {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    if(ObjectID.isValid(id)) {
        users.findById(new ObjectID(id), function(error, user) {
            if(error) {
                done(err);
            } else {
                done(null, user);
            }
        });
    } else {
        done(null, false);
    }
});

passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK
    },
    function(accessToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
            var email = profile.emails[0].value;
            users.findByEmail(email, function(err, user){
                if(err) {
                  return done(null, false);
                } else {
                    if(user) {
                        user.external = profile;
                        user.displayName = profile.displayName;
                        users.updateExternalInfo(user, function(err, savedUser) { // asynchronous user update
                            if(!err) {
                                log.info('Login %s: user is updated!', user.displayName);
                            }
                        });
                      exports.changeUser = done;
                      return done(null, user);
                    } else {
                        var user = {
                            email: email,
                            external: profile,
                            displayName: profile.displayName,
                            role: constants.OWNER_ROLE
                        };
                        createUser(user, done);
                    }
                }
            });
        });
      }
));

exports.ensureAuthenticated = function (req, res, next) {
    if(process.env.APPLICATION_TEST) {
        return next();
    }
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({msg: 'You aren’t authenticated!'});
};

exports.init = function(app) {
    app.use(passport.initialize());
    app.use(passport.session());

    app.get('/googlelogin', function (req, res, next) {
        passport.authenticate('google',
            {
                scope: ['https://www.googleapis.com/auth/userinfo.email',
                      'https://www.googleapis.com/auth/userinfo.profile']
            })(req, res, next);
    });

    app.get('/oauth2callback',
        passport.authenticate('google', { failureRedirect: loginRedirect }),
            function(req, res) {
                res.redirect(loginRedirect);
            }
    );

    app.get('/logout', logout);

    log.info('Authentication module is initialized!');
};

//private part
function logout(req, res) {
    req.logout();
    res.redirect(loginRedirect);
}

function createUser(user, callback) {
    users.save(user, function(err, savedUser){
        if(err) {
            callback(err, savedUser);
        } else {
            callback(null, savedUser);
        }
    });
}

function testUser(callback) {
    users.findByEmail('test@test.com', function(err, user){
        callback(null, user);
    });
}
