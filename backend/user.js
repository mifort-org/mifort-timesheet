var dbSettings = require('./libs/mongodb_settings');

exports.findUserByEmail = function(email, callback) {
    var users = dbSettings.userCollection();
    users.findOne({email: email}, function(err, docs){
        callback(err, docs);
    });
};

exports.save = function(user, callback) {
    var users = dbSettings.userCollection();
    users.save(user, {safe:true}, function (err, results) {
        callback(err, results);
    });
};