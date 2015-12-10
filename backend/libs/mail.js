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

 var request = require('request');

 exports.sendEmail = function(to, body) {
     request.post({ url: 'https://api.mailgun.net/v3/sandbox22b92f927ef4426b859ac877a0260ad4.mailgun.org/messages',
                    form: {
                        from: 'Mifort Timesheet <mailgun@sandbox22b92f927ef4426b859ac877a0260ad4.mailgun.org>',
                        to: to,
                        subject: 'Invite to Mifort Timesheeet',
                        text: body
                    },
                    auth: {
                        'user': 'api',
                        'pass': 'YOUR_KEY'
                    }
                },
                function(err, httpResponse, body){
                    console.log(err);
                    console.log('---------------------------------');
                    console.log(httpResponse);
                    console.log('---------------------------------');
                    console.log(body);
                });
 };
