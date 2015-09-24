var moment = require('moment');

var dbSettings = require('./libs/mongodb_settings');
var users = require('./user');
var utils = require('./libs/utils');
var registration = require('./libs/registration');

//Rest API
exports.restFindById = function(req, res) {
    var companyId = utils.getCompanyId(req, res);
    findById(companyId, function(err, company) {
        if(err) {
            res.status(400).json({error: 'Cannot find company!'});
        } else {
            res.json(company);
        }
    });
};

exports.restCreateCompany = function(req, res) {
    var company = req.body;
    var defaultCompany = exports.generateDefaultCompany();
    company.template = defaultCompany.template;
    company.periods = defaultCompany.periods;

    save(company, function(err, savedCompany) {
        if(err) {
            res.status(500).json(err);        
        } else {
            //Warning: asynchronous block!!! 
            registration.createDefaultProject(savedCompany, req.user); //Validation: check user!!!
            createUsersByEmails(savedCompany);
            res.json(savedCompany);
        }
    });
};

exports.restUpdateCompany = function(req, res) {
    var company = req.body;
    save(company, function(err, savedCompany) {
        if(err) {
            res.status(500).json(err);        
        } else {
            //update all projects
            var projects = dbSettings.projectCollection();
            projects.update(
                    {companyId: savedCompany._id},
                    {$set: {template: savedCompany.template},
                     $set: {periods: savedCompany.periods},
                     $set: {defaultValues: savedCompany.defaultValues}},
                    {multi:true}, 
                function(err, result){
                    console.log('Company projects are updated!')
                });
            createUsersByEmails(savedCompany);
            res.json(savedCompany);
        }
    });
};

//Public API
exports.save = save;

exports.generateDefaultCompany = function() {
    var periods = [];
    
    var firstPeriod = {
        start: moment.utc().toDate(),
        end: moment.utc().endOf('week').toDate()
    };
    periods.push(firstPeriod);
    
    //generate 53 weeks (1 year)
    var startDate = moment.utc(firstPeriod.end).add(1,'day').toDate();
    var endDate = moment.utc(startDate).endOf('week').toDate();
    for (var i = 0; i < 53; i++) {
        periods.push({
            start: startDate,
            end: endDate
        });
        startDate = moment.utc(endDate).add(1,'day').toDate();
        endDate = moment.utc(startDate).endOf('week').toDate();
    };

    var company = {
        template : {
            date: "",
            role: "",
            time: 8,
            comment: ""
        },
        periods: periods
    }

    return company;
};

//private part
function findById(id, callback) {
    var companies = dbSettings.companyCollection();
    companies.findOne({_id: id}, function(err, company){
        callback(err, company);
    });
}

function createUsersByEmails(company) {
    var emails = company.emails;
    if(emails) {
        emails.forEach(function(email) {
            var user = {email: email,
                        companyId: company._id};

            users.findByExample(user, function(err, dbUser) {
                if(err) {
                    console.log(err);
                } else if(!dbUser) {
                    users.save(user, function(err, savedUser) {
                        if(err) {
                            console.log(err);
                        } else {
                            console.log('User saved:');
                            console.log(savedUser.email);
                        }
                    });
                }
            });
            
        })
    }
}

function save(company, callback) {
    var companies = dbSettings.companyCollection();
    companies.save(company, {safe:true}, function (err, result) {
        if(result.ops) {
            callback(err, result.ops[0]);
        } else {
            callback(err, company);
        }
    });
};