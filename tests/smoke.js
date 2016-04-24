module.exports = {
    after : function(browser) {
        process.exit();
    },
    'Timesheet fill test' : function(browser) {
        browser
            .pause(2000) //for first test because of server start delay
            .init()
            .waitForElementVisible('.logo', 2000)
            // Check only one day
            .assert.containsText('#step3 tr:nth-child(2) td:nth-child(2)', 'Developer')
            .clearValue('#step3 tr:nth-child(1) td:nth-child(3) input')
            .setValue('#step3 tr:nth-child(1) td:nth-child(3) input', '8')
            .clearValue('#step3 tr:nth-child(1) td:nth-child(4) input')
            .setValue('#step3 tr:nth-child(1) td:nth-child(4) input', 'Test comment bla')
            .click('.tabs-left li:nth-child(5)')
            //temporary selection because of #197
            .waitForElementVisible('.date-range-picker input', 1000)
            .click('.date-range-picker input')
            .click('.daterangepicker .ranges ul li:nth-child(2):not(.active)')
            //end of temporary selection
            .pause(1000)
            .assert.containsText('.ui-grid-render-container', 'Test comment bla')
            .assert.containsText('.ui-grid-render-container', 'Developer')
            .assert.containsText('.ui-grid-render-container', '8')
            //add sub task
            .click('.tabs-left li:nth-child(6)')
            .waitForElementVisible('#step3 tr:nth-child(1) .add-timesheet', 1000)
            .click('#step3 tr:nth-child(1) .add-timesheet')
            .clearValue('#step3 tr:nth-child(2) td:nth-child(3) input')
            .setValue('#step3 tr:nth-child(2) td:nth-child(3) input', '3')
            .clearValue('#step3 tr:nth-child(2) td:nth-child(4) input')
            .setValue('#step3 tr:nth-child(2) td:nth-child(4) input', 'Test sub task')
            .pause(500)
            .click('.tabs-left li:nth-child(5)')
            //temporary selection because of #197
            .waitForElementVisible('.date-range-picker input', 1000)
            .click('.date-range-picker input')
            .click('.daterangepicker .ranges ul li:nth-child(2):not(.active)')
            //end of temporary selection
            .pause(1000)
            .assert.containsText('.ui-grid-render-container', 'Test sub task')
            .assert.containsText('.ui-grid-render-container', '3')
            .end();
    }
};
