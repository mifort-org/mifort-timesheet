module.exports = {
    after : function(browser) {
        process.exit();
    },
    'Timesheet fill test' : function(browser) {
        browser
            .init()
            .waitForElementVisible('.logo', 2000)
            // Check only one day
            .assert.containsText('#step3 tr:nth-child(2) td:nth-child(2)', 'Developer')
            .clearValue('#step3 tr:nth-child(1) td:nth-child(3) input')
            .setValue('#step3 tr:nth-child(1) td:nth-child(3) input', '8')
            .clearValue('#step3 tr:nth-child(1) td:nth-child(4) input')
            .setValue('#step3 tr:nth-child(1) td:nth-child(4) input', 'Test comment bla')
            .pause(500)
            .click('.tabs-left li:nth-child(5)')
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
            .waitForElementVisible('.date-range-picker input', 1000)
            .pause(1000)
            .assert.containsText('.ui-grid-render-container', 'Test sub task')
            .assert.containsText('.ui-grid-render-container', '3')
            .end();
    },
    'Project creation': function(browser) {
        browser
            .init()
            .waitForElementVisible('.logo', 2000)
            .click('.tabs-left li:nth-child(2)')
            .waitForElementVisible('.add-project', 1000)
            .click('.add-project')
            .click('#step1 tr:nth-child(1) #simple-dropdown')
            .click('#step1 tr:nth-child(1) td:nth-child(1) ul li a')
            .setValue('#step1 tr:nth-child(1) td:nth-child(3) input', '5')
            .click('.tabs-left li:nth-child(6)')
            .waitForElementVisible('.main-container', 1000)
            .assert.containsText('.main-container', 'New Project')
            .assert.containsText('.main-container', 'CEO')
            .end();
    }
};
