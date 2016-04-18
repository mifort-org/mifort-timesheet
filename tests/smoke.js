require('../app');

module.exports = {
    after : function(browser) {
        process.exit();
    },
    'Application start test' : function (browser) {
        browser
            .pause(1500)
            .url('http://localhost:1313')
            .waitForElementVisible('body', 2000)
            .assert.containsText('.form-signin', 'Timesheet')
            .end();
  }
};
