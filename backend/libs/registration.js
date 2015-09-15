var companies = require('../company');
var users = require('../user');
var projects = require('../project');

var registrationRedirect = '/company';

exports.createUser = function(user, callback) {
    users.save(user, function(err, user){
        if(err) {
            callback(err, user);
        } else {
            var company = companies.generateDefaultCompany();
            company.ownerId = user._id;
            companies.save(company, function(err, company){
                console.log('Defaul company is created!');
                if(err) {
                    callback(err, user);
                } else {
                    var project = projects.generateDefaultProject(company);
                    projects.saveInDb(project, function(err, project) {
                        console.log('Defaul project is created!');
                        if(err) {
                            callback(err, user);
                        } else {
                            callback(null, user);
                        }
                    });
                }
            });
        }
    });
};
