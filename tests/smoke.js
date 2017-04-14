module.exports = {
    after : function(browser) {
        process.exit();
    },

    'Fill Timesheet' : function(browser) {
        var testComment = 'Test comment bla';
        var subComment = 'Test sub task';
        browser
            .init()
            .waitForElementVisible('.logo', 2000)
            // Check only one day
            .waitForElementVisible('.table tbody tr:nth-child(2) td:nth-child(2)', 1000)
            .clearValue('.table tbody tr:nth-child(1) td:nth-child(3) input')
            .setValue('.table tbody tr:nth-child(1) td:nth-child(3) input', '8')
            .clearValue('.table tbody tr:nth-child(1) td:nth-child(4) input')
            .setValue('.table tbody tr:nth-child(1) td:nth-child(4) input', testComment)
            .pause(500)
            //go to report
            .click('.tabs-left li:nth-child(5)')
            .pause(1000)
            .assert.containsText('.ui-grid-canvas .ui-grid-row:nth-child(1) .ui-grid-cell:nth-child(5)', testComment)
            .assert.containsText('.ui-grid-canvas .ui-grid-row:nth-child(1) .ui-grid-cell:nth-child(4)', '8')
            //add sub task
            .click('.tabs-left li:nth-child(6)')
            .waitForElementVisible('.table tbody tr:nth-child(1) .add-timesheet', 1000)
            .click('.table tbody tr:nth-child(1) .add-timesheet')
            .clearValue('.table tbody tr:nth-child(2) td:nth-child(3) input')
            .setValue('.table tbody tr:nth-child(2) td:nth-child(3) input', '3')
            .clearValue('.table tbody tr:nth-child(2) td:nth-child(4) input')
            .setValue('.table tbody tr:nth-child(2) td:nth-child(4) input', subComment)
            .pause(500)
            .click('.tabs-left li:nth-child(5)')
            .waitForElementVisible('.date-range-picker input', 1000)
            .pause(1000)
            .assert.containsText('.ui-grid-canvas .ui-grid-row:nth-child(2) .ui-grid-cell:nth-child(5)', subComment)
            .assert.containsText('.ui-grid-canvas .ui-grid-row:nth-child(2) .ui-grid-cell:nth-child(4)', '3')
            .end();
    },

    'Project creation': function(browser) {
        browser
            .init()
            .waitForElementVisible('.logo', 2000)
            .click('.tabs-left li:nth-child(2)')
            .waitForElementVisible('.add-project', 1000)
            .click('.add-project')
            .pause(500)
            .click('#step1 tr:nth-child(1) #simple-dropdown')
            .click('#step1 tr:nth-child(1) td:nth-child(1) ul li a')
            .setValue('#step1 tr:nth-child(1) td:nth-child(3) input', '5')
            //check new assignment on timesheet page
            .click('.tabs-left li:nth-child(6)')
            .waitForElementVisible('.main-container', 1000)
            .pause(1000)
            .assert.containsText('.main-container', 'New Project')
            .assert.containsText('.main-container', 'CEO')
            .end();
    },

    'Check employee page': function(browser) {
        var email = 'And@red.net';
        browser
            .init()
            .waitForElementVisible('.logo', 2000)
            //invite new person
            .click('.tabs-left li:nth-child(1)')
            .waitForElementVisible('#step1', 1000)
            .setValue('#step2', email)
            .click('#step3')
            .pause(500)
            .assert.containsText('#step4', email)
            //assign new user to project
            .click('.tabs-left li:nth-child(2)')
            .waitForElementVisible('.add-project', 1000)
            .click('.add-project')
            .pause(500)
            .click('#step1 tr:nth-child(1) #simple-dropdown')
            .click('#step1 tr:nth-child(1) td:nth-child(1) ul li a')
            .setValue('#step1 tr:nth-child(1) td:nth-child(3) input', '6')
            //check employee page
            .click('.tabs-left li:nth-child(3)')
            .waitForElementVisible('.main-container form:first-of-type', 1000)
            .setValue('.main-container form p:first-of-type input', email)
            .click('.main-container form button.primary-button')
            .assert.containsText('.main-container section:first-of-type', email)
            .assert.containsText('.main-container section:first-of-type', 'New Project')
            .click('.main-container section:first-of-type .employee-assignment a')
            .assert.containsText('.main-container section:first-of-type', 'CEO')
            .end();
    },

    'Check company page': function(browser) {
        // New user invitation is checked in previous  test
        var newCompanyName = 'Tralala';
        browser
            .init()
            .waitForElementVisible('.logo', 2000)
            .click('.tabs-left li:nth-child(1)')
            .waitForElementVisible('#step1', 1000)
            .clearValue('#step1')
            .setValue('#step1', newCompanyName)
            .pause(900)
            .assert.containsText('.logo', newCompanyName)
            .end();
    },

    'Check report page': function(browser) {
        browser
            .init()
            .waitForElementVisible('.logo', 2000)
            .click('.tabs-left li:nth-child(5)')
            .pause(1000)
            //Check Project report
            .click('.aggregation-options li:nth-child(2) a')
            .pause(500)
            .assert.containsText('.ui-grid-render-container', 'Mifort-Test')
            .assert.containsText('.ui-grid-render-container', '11')
            //Check employee report
            .click('.aggregation-options li:nth-child(3) a')
            .pause(500)
            .assert.containsText('.ui-grid-render-container', 'Test User')
            .assert.containsText('.ui-grid-render-container', '11')
            //Check Employee + Project Page
            .click('.aggregation-options li:nth-child(4) a')
            .pause(500)
            .assert.containsText('.ui-grid-render-container', 'Test User')
            .assert.containsText('.ui-grid-render-container', 'Mifort-Test')
            .assert.containsText('.ui-grid-render-container', '11')
            .end();
    }
};
