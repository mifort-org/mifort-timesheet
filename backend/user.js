var dbSettings = require('./libs/mongodb_settings');
var utils = require('./libs/utils');

exports.save = function(user, callback) {
    var users = dbSettings.userCollection();
    users.save(user, {safe:true}, function (err, result) {
        if(result.ops) {
            callback(err, result.ops[0]);
        } else {
            callback(err, user);
        }
    });
};

exports.findByEmail = function(email, callback) {
    findByExample({email: email}, callback);
};

//or from db???
exports.restGetById = function(req, res) {
    var user = req.user;
    res.json(user);
};

exports.findById = function(id, callback) {
    findByExample({id:_id}, callback);
};

exports.findByExample = findByExample;

//private 
function findByExample(query, callback) {
    var users = dbSettings.userCollection();
    users.findOne(query, function(err, user){
        callback(err, user);
    });
}