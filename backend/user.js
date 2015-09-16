var dbSettings = require('./libs/mongodb_settings');
var utils = require('./libs/utils');
var companies = require('./company');

//Rest API
exports.restGetCurrent = function(req, res) {
    var user = req.user;
    res.json(user);
};

exports.restAddAssignment = function(req, res) {
    var userInfo = req.body;
    if(userInfo) {
        var users = dbSettings.userCollection();
        users.update({_id: userInfo._id}, 
            {$push:{assignments: userInfo.assignment}},
            function(err, result) {
                if(err) {
                    res.status(500).json(err);
                } else {
                    console.log('Assignment inserted');
                    console.dir(result);
                    res.json(result);
                }
            });
    } else {
        res.status(500).json({err:'Empty body'});
    }
};

exports.restGetByProjectId = function(req, res) {
    var projectIdParam = utils.getProjectId(req, res);
    if(projectIdParam) {
        var users = dbSettings.userCollection();
        users.find({'assignments.projectId': projectIdParam},
                   { assignments: {$elemMatch: {projectId: projectIdParam}}})
          .toArray(function(err, projectUsers){
            if(err) {
                res.status(400).json({error: 'Cannot find users'});
            } else {
                res.json(projectUsers);
            }
        });
    }
};

//Public API
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

exports.findById = function(id, callback) {
    findByExample({_id:id}, callback);
};

exports.findByExample = findByExample;

//private 
function findByExample(query, callback) {
    var users = dbSettings.userCollection();
    users.findOne(query, function(err, user){
        callback(err, user);
    });
}