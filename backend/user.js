var dbSettings = require('./libs/mongodb_settings');
var utils = require('./libs/utils');
var companies = require('./company');

//Rest API
exports.restGetCurrent = function(req, res) {
    var user = req.user;
    res.json(user);
};

exports.restGetByProjectId = function(req, res) {
    var projectIdParam = utils.getProjectId(req);
    var users = dbSettings.userCollection();
    users.find({'assignments.projectId': projectIdParam},
               {
                workload: 1,
                displayName: 1, 
                assignments: 1
               })
      .toArray(function(err, projectUsers) {
        if(err) {
            res.status(404).json({error: 'Cannot find users'});
        } else {
            if(projectUsers) { 
                projectUsers.forEach(function(user) { // not efficient???? Maybe: Client side???
                    user.assignments = user.assignments.filter(function(assignment) {
                       return projectIdParam.equals(assignment.projectId);
                    });
                });
            }
            res.json(projectUsers);
        }
    });
};

exports.restGetByCompanyId = function(req, res) {
    var companyIdParam = utils.getCompanyId(req);
    var users = dbSettings.userCollection();
    users.find({companyId: companyIdParam},
               {workload: 1,
                displayName: 1})
        .toArray(function(err, companyUsers) {
            if(err) {
                res.status(404).json({error: 'Cannot find users'});
            } else {
                res.json(companyUsers);
            }
        });
};

exports.restReplaceAssignments = function(req, res) {
    var projectId = utils.getProjectId(req);
    var user = req.body;
    var userId = user._id;
    var assignments = user.assignments || {};
    var users = dbSettings.userCollection();
    users.update({ _id: userId },
                 { $pull: {assignments: {projectId: projectId} } },
                 { multi: true },
        function(err, result) {
            if(!err) {
                users.update({ _id: userId },
                             { $push: { assignments: { $each: assignments } }},
                    function(err, updatedUser){
                        res.json({ok: true}); //saved object???
                    });
            } else {
                res.status(400).json(err);
            }
        });
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