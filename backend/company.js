var dbSettings = require('./libs/mongodb_settings');

exports.save = function(company, callback) {
    var companies = dbSettings.companyCollection();
    companies.save(company, {safe:true}, function (err, results) {
        callback(err, results);
    });
};

exports.findById = function(id, callback) {
    var companies = dbSettings.companyCollection();
    companies.findOne({companyId: id}, function(err, company){
        callback(err, company);
    });
};