'use strict';
// Logging
var appLogger = require( "../../../lib/appLogger.js" );

var mail = require('nodemailer');
var users = require('./users.js');
var os = require('os');
var dns = require('dns');

// Figure out our server's domain name.
var hostUrl = "localhost";

var h = os.hostname();

dns.lookup(h, { hints: dns.ADDRCONFIG }, function(err, ip) {
    dns.lookupService(ip, 0, function (err, hostname, service) {
        if (err) {
            appLogger.log(err);
            return;
        }
        hostUrl = hostname;
	appLogger.log('Host domain name for emailed links: ' + hostname);
    });
});

// create reusable transporter object using the default SMTP transport
let transport = mail.createTransport({
    host: "localhost",
    port: 25,
    tls:{
        rejectUnauthorized: false
    }
});


let verifyNewEmailToOldAccount = {
    from: 'noreply@cablelabs.com',
    subject: 'LPWAN Server account email change requested for %USERNAME%',
    textMessage: `
Hello,

We have received a request to change the email address on the LPWAN Server
account %USERNAME%.  If this request is in error, please click the link
below to reject the change:

%REJECT_LINK%

Thank you.`
};

let verifyNewEmailToNewAccount = {
    from: 'noreply@cablelabs.com',
    subject: 'LPWAN Server account email change requested for %USERNAME%',
    textMessage: `
Hello,

We have received a request to change the email address on the LPWAN Server
account %USERNAME% to this email address.  Please verify this email
address by clicking this link:

%ACCEPT_LINK%

Otherwise, if this change was in error, please click this link to reject
the change:

%REJECT_LINK%

Thank you.`
};

let reportEmailReject = {
    from: 'noreply@cablelabs.com',
    subject: 'Rejected email change for user %USERNAME%',
    textMessage: `
Hello,

We have received a request to change the email address on the LPWAN Server
account %USERNAME% from %OLD_EMAIL% to %NEW_EMAIL%,
but the request was rejected by the %SOURCE% email.

We are reporting this in case it happens repeatedly, as that may indicate
something is going on that should be reviewed.

Thank you.`
};

exports.verifyEmail = function( oldemail, newemail, username, uuid ) {
    // Set up the url root
    var urlRoot = "https:\/\/" + hostUrl;
    // First send an email to the old account
    if ( oldemail ) {
        var emailMsgOld = emailCustomize( verifyNewEmailToOldAccount,
                                          username,
                                          "", // old email cannot accept change.
                                          urlRoot +
                                          "\/portal\/emailverify?uuid=" +
                                          uuid +
                                          "&type=reject&source=old"
                                        );
        var emailOptionsOld = {
            from: emailMsgOld.from,
            to: oldemail,
            subject: emailMsgOld.subject,
            text: emailMsgOld.textMessage
        };

        transport.sendMail( emailOptionsOld, (error, info) => {
            if (error) {
                return appLogger.log( "Failed to send old email (" + oldemail +
                ") reject message with UUID = " + uuid +
                ".  Error = " + error );
            }
            appLogger.log( 'Message ' + info.messageId +
                           ' sent to old email ' + oldemail +
                           ': ' + info.response);
        });
    }

    // Now send an email to the new account
    var emailMsgNew = emailCustomize( verifyNewEmailToNewAccount,
                                      username,
                                      urlRoot +
                                      "\/portal\/emailverify?uuid=" +
                                      uuid +
                                      "&type=accept&source=new",
                                      urlRoot +
                                      "\/portal\/emailverify?uuid=" +
                                      uuid +
                                      "&type=reject&source=new"
                                    );
    var emailOptionsNew = {
        from: emailMsgNew.from,
        to: newemail,
        subject: emailMsgNew.subject,
        text: emailMsgNew.textMessage
    };

    transport.sendMail( emailOptionsNew, (error, info) => {
        if (error) {
            return appLogger.log( "Failed to send new email (" + newemail +
                                  ") accept/reject message with UUID = " + uuid +
                                  ".  Error = " + error );
        }
        appLogger.log( 'Message ' + info.messageId +
                       ' sent to new email ' + newemail +
                       ':' + info.response);
    });

}

exports.notifyAdminsAboutReject = function( user, source ) {
    var subject = reportEmailReject.subject
                            .replace( "%USERNAME%", user.username );
    var textMessage = reportEmailReject.textMessage
                            .replace( "%USERNAME%", user.username )
                            .replace( "%NEW_EMAIL%", user.email)
                            .replace( "%OLD_EMAIL%", user.lastVerifiedEmail);

    users.getCompanyAdmins( user.companyId ).then( function( usersAdmins ) {
        var emailOptions = {
            from: reportEmailReject.from,
            to: usersAdmins,
            subject: subject,
            text: textMessage
        };

        transport.sendMail( emailOptions, (error, info) => {
            if (error) {
                return appLogger.log( "Failed to send reject warning message for user " + user.username + ".  Error = " + error.errno );
                }
            appLogger.log( 'Message ' + info.messageId +
                           ' sent to admins warning of rejected email change for user ' + user.username +
                           ': ' + info.response );
        });
    })
    .catch( function ( err ) {
        // Drop a log entry - all we can do.
        appLogger.log( "Failed to get admin emails for user " + user.username  +
                       ", warning of reject of updated email: " + err );
    });
}

function emailCustomize( template, username, acceptLink, rejectLink ) {
    var customizedEmail = {};
    customizedEmail.from = template.from;
    customizedEmail.subject = template.subject
                                    .replace( "%USERNAME%", username );
    customizedEmail.textMessage = template.textMessage
                                    .replace( "%USERNAME%", username )
                                    .replace( "%ACCEPT_LINK%", acceptLink )
                                    .replace( "%REJECT_LINK%", rejectLink );
    return customizedEmail;
}
