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
var dbSettings = require('./mongodb_settings');

//Public
exports.authorizedSaveProject = function(req, res, next) {
    var user = req.user;
    var project = req.body;
    if(user) {
        if(canWriteProject(user, project)) {
            next();
            return;
        }
    }
    res.status(403).json({msg: 'REST call is not permitted!'});
};

exports.authorizedGetProject = function(req, res, next) {
    var user = req.user;
    var project = req.body;
    if(user) {
        if(canReadProject(user, project)) {
            next();
            return;
        }
    }
    res.status(403).json({msg: 'REST call is not permitted!'});
};

exports.authorizedSaveTimelog = function(req, res, next) {
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
                res.status(403).json({msg: 'REST call is not permitted!'});
            },
            function() { //success callback
                next();
            });
    } else {
        next();
    }
};

//Private 
function canWriteProject(user, project) {
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

        return hasAssignment && user.role === 'Manager';
    }

    return false;
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

    var users = dbSettings.userCollection();
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