The reportingProtocols directory handles sending data received from remote
networks and passing that data to the user's application server.

To add a new reportingProtocol, copy protocolhandlertemplate.js to a file with
a name that describes the methodology to some degree.  Then implement the
exports.report() method to send the passed data.

Once the code is complete, you can use a global admin account in the UI to add
the new reportingProtocol to the system for use by applications.
