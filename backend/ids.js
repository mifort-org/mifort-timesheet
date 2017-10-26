var utils = require('./libs/utils');
var log = require('./libs/logger');

exports.restGetIds = function(req, res, next) {
    var count = req.params.count;
    log.debug('-REST call: Generate ids count: %d', count);

    res.json( utils.getNewObjectID(count) );
};