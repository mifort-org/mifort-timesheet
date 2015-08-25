var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "put-your-credentials";
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "put-your-credentials";

var users = require('../user');

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    users.findById(id, function(error, user) {
        if(error) {
            done(err);
        } else {
            done(null, user);
        }
    });
    
});

passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "http://127.0.0.1:1313/oauth2callback"
    },
    function(accessToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
            var email = profile.emails[0].value;
            users.findByEmail(email, function(err, user){
                if(err) {
                  return done(null, false);
                }
                user.external = profile;
                return done(null, user);
            });
        });
      }
));

exports.ensureAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) { 
        return next(); 
    }
    res.redirect('/login');
};

exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
};

exports.init = function(app) {
    app.use(passport.initialize());
    app.use(passport.session());

    app.get('/login', 
        passport.authenticate('google', 
            { scope: ['https://www.googleapis.com/auth/userinfo.email',
                      'https://www.googleapis.com/auth/userinfo.profile'] }),
            function(req, res){
              // function will not be called (Never)
            }
    );

    app.get('/oauth2callback', 
        passport.authenticate('google', { failureRedirect: '/login' }),
            function(req, res) {
                res.redirect('/');
            }
    );
};