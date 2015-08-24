var dbSettings = require('./libs/mongodb_settings');

exports.findUserByEmail = function(email, callback) {
    var users = dbSettings.userCollection();
    users.findOne({email: email}, function(err, user){
        callback(err, user);
    });
};

exports.findUserById = findUserById;

function findUserById(id, callback) {
    var users = dbSettings.userCollection();
    users.findOne({_id: id}, function(err, user){
        callback(err, user);
    });
};

exports.save = function(user, callback) {
    var users = dbSettings.userCollection();
    users.save(user, {safe:true}, function (err, results) {
        callback(err, results);
    });
};

exports.restGetUserById = function(req, res) {
    var userId = utils.getUserId(req, res);
    if(userId) {
        findUserById(userId, function(err, user) {
            if(err) {
                res.status(400).json(err);
            } else {
                res.json(user);
            }
        });
    }
};