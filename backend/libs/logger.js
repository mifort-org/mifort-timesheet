var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      name: 'common-file',
      filename: 'filelog-common.log',
    }),
    new (winston.transports.File)({
      name: 'error-file',
      filename: 'filelog-error.log',
      level: 'error'
    }),
    new (winston.transports.Console)()
  ]
});

module.exports = logger;