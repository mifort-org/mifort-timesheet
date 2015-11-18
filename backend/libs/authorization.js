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

//TODO: move common parts to functions

var db = require('./mongodb_settings');
var utils = require('./utils');

//Public
//Project
exports.authorizeSaveProject = function(req, res, next) {
    var user = req.user;
    var project = req.body;
    if(user) {
        if(canWriteProject(user, project)) {
            next();
            return;
        }
    }
    send403(res);
};

exports.authorizeGetProject = function(req, res, next) {
    var user = req.user;
    var projectId = utils.getProjectId(req);
    
    var projects = db.projectCollection();
    projects.findOne({_id: projectId}, function(err, project) {
        if(err) {
            send403(res); //error. Not a permission function
        } else {
            if(canReadProject(user, project)) {
                next();
            } else {
                send403(res);
            }
        }
    });
};

exports.authorizeGetProjects = function(req, res, next) {
    var user = req.user;
    var companyId = utils.getCompanyId(req);

    if(user.companyId.equals(companyId)) {
        next();
    } else {
        send403(res);
    }
};

exports.authorizeDeactivateProject = function(req, res, next) {
    var user = req.user;
    var projectId = utils.getProjectId(req);
    
    var projects = db.projectCollection();
    projects.findOne({_id: projectId}, function(err, project) {
        if(err) {
            send403(res);
        } else {
            if(canWriteProject(user, project)) {
                next();
            } else {
                send403(res);
            }
        }
    });
};

//Timelog
exports.authorizeSaveTimelog = function(req, res, next) {
    var timelogs = req.body.timelog;
    var user = req.user;
    if(timelogs) {
        var isYourTimelog = timelogs.every(function(log) {
            return user._id.equals(log.userId);
        }); 
        if(isYourTimelog){
            next();
            return;
        }

        var userIds = timelogs.map(function(log){
            return log.userId;
        });
        isManagerForUser(user, userIds,
            function() { // fail callback
                send403(res);
            },
            function() { //success callback
                next();
            });
    } else {
        next();
    }
};

exports.authorizeGetTimelog = function(req, res, next) {
    var user = req.user;
    var userId = utils.getUserId(req);

    if(userId.equals(user._id)){
        next();
        return;
    }

    isManagerForUser(user, [userId],
        function() { // fail callback
            send403(res);
        },
        function() { //success callback
            next();
        });
};

exports.authorizeDeleteTimelog = function(req, res, next) {
    var user = req.user;
    var timelogId = utils.getTimelogId(req);

    var timelogs = db.timelogCollection();
    timelogs.findOne({_id: timelogId}, function(err, timelog) {
        if(err) {
            send403(res);
        } else {
            if(timelog.userId.equals(user._id)) {
                next();
            } else {
                isManagerForUser(user, [timelog.userId],
                    function() { // fail callback
                        send403(res);
                    },
                    function() { //success callback
                        next();
                    });
            }
        }
    });
};

//User
exports.authorizeGetUsersByProjectId = function(req, res, next){
    var user = req.user;
    var projectId = utils.getProjectId(req);

    var projects = db.projectCollection();
    projects.findOne({_id: projectId}, function(err, project) {
        if(err) {
            send403(res);
        } else {
            if(canWriteProject(user, project)) {
                next();
            } else {
                send403(res);
            }
        }
    });
};

exports.authorizeGetUsersByCompanyId = function(req, res, next) {
    var user = req.user;
    var companyId = utils.getCompanyId(req);

    if(companyId.equals(user.companyId) && 
            (user.role === 'Owner' || user.role === 'Manager')) {
        next();
    } else {
        send403(res);
    }
};

exports.authorizeAddAssignment = exports.authorizeGetUsersByProjectId;

//Company
exports.authorizeUpdateCompany = function(req, res, next) {
    var user = req.user;
    var company = req.body;
    if(company.ownerId.equals(user._id) && user.role === 'Owner') {
        next();
    } else {
        send403(res);
    }
};

exports.authorizeCreateCompany = function(req, res, next) {
    var user = req.user;
    if(user.companyId) {
        send403(res, 'You already have company/assignment on a company');
    } else {
        next();
    }
};

exports.authorizeFindCompanyById = function(req, res, next) {
    var user = req.user;
    var companyId = utils.getCompanyId(req);
    if(companyId.equals(user.companyId)) {
        next();
    } else {
        send403(res);
    }
};

//Reports
exports.authorizeGetFilters = function(req, res, next) {
    var user = req.user;
    var companyId = utils.getCompanyId(req);
    if(companyId.equals(user.companyId) 
            && (user.role === 'Manager' || user.role === 'Owner')) {
        next();
    } else {
        send403(res);
    }
};

exports.authorizeCommonReport = function(req, res, next) {
    var user = req.user;
    var filters = req.body;
    if(filters.companyId.equals(user.companyId) 
            && (user.role === 'Manager' || user.role === 'Owner')) {
        next();
    } else {
        send403(res);
    }
};

//Private 
function canWriteProject(user, project) {
    if(!user.companyId.equals(project.companyId)) {
        return false;
    }

    return user.role === 'Owner' || user.role === 'Manager';
}

function canReadProject(user, project) {
    if(!user.companyId.equals(project.companyId)) {
        return false;
    }

    if(user.role === 'Owner') {
        return true;
    }

    if(user.assignments) {
        var hasAssignment = user.assignments.some(function(assignment) {
            return assignment.projectId.equals(project._id);
        });

        return hasAssignment;
    }

    return false;
}

function isManagerForUser(manager, userIds, errorCallback, successCallback) {
    if(manager.role !== 'Manager' || manager.role !== 'Owner') {
        errorCallback();
        return;
    }

    var users = db.userCollection();
    users.find({_id: {$in: userIds}}).toArray(function(err, selectedUsers) {
        if(err) {
            errorCallback(err);
        } else {
            var managerForEveryUser = selectedUsers.every(function(user){
                return manager.companyId.equals(user.companyId);
            });
            if(managerForEveryUser) {
                successCallback();
            } else {
                errorCallback(); 
            }
        }
    });
}

function send403(res, message) {
    var msg = 'REST call is not permitted!';
    if(message) {
        msg = message;
    }

    res.status(403).json({msg: msg});
}
