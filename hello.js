var http = require('http');
var fs = require('fs');
var parameters = require('./params.js');
var nodemailer = require('nodemailer');
var url = require("url");
var c = require("./credentials.js");


// send registration email
function sendRegistrationEmail(newReg) {

    var content = "";
    content += "Imię i nazwisko: " + newReg.name + "\n";
    content += "Adres email: " + newReg.email + "\n";
    content += "Numer telefonu: " + newReg.phone + "\n";
    content += "Typ passa: " + newReg.passType + "\n";
    content += "Uwagi: " + newReg.comments + "\n";

    // create reusable transporter object using the default SMTP transport
    var transporter = nodemailer.createTransport('smtps://' + c.login + ':' + c.pass + '@smtp.wp.pl');
    
    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"WBMU! Website" <oas@wp.pl>', // sender address
        to: parameters.recipient, // list of receivers
        subject: 'Rejestracja: ' + newReg.name, // Subject line
        encoding: 'utf-8',
        text: content // plaintext body
    };
    
    if (newReg.name == 'test') mailOptions.to = 'Olgierd Skibski <o.skibski@gmail.com>';

    // send mail with defined transport object
    // transporter.sendMail(mailOptions, function (error, info) {
    //     if (error) {
    //         return console.log(error);
    //     }
    //     console.log('Message sent: ' + info.response);
    // });

}


function addRegistration(path, body, response) {
    
    // send an email --wrong place for that--
    sendRegistrationEmail(body);

    // prepare a log record
    var log = JSON.stringify({
        timestamp: new Date().toLocaleString(),
        content: body
    });

    // append log record to log file
    fs.appendFile('registrations.log', log + ",\n", function (err) {
        if (err) return console.log(err);
        console.log('Success!');
    });

    response.writeHead(parameters.ok);
    response.end();
}


function getRegistrations(path, body, response) {

    console.log(path);
    var regsText = fs.readFileSync("registrations.log");

    var regs = JSON.parse("[" + regsText + "{}]");
    regs.pop();
    console.log(JSON.stringify(regs));

    response.writeHead(parameters.ok);
    response.write(JSON.stringify(regs, false, "  "));
    response.end();
}


// registrations service router
function registrations(method, path, body, response) {
    
    console.log(method);
    // depending on request method, perform the action
    if ( method == "POST" )
        addRegistration(path, body, response);
    if ( method == "GET" )
        getRegistrations(path, body, response);
}

// create proxy
http.createServer(function (request, response) {

    // parse url path
    var parsedUrl = url.parse(request.url, true); // true to get query as object
    var path = parsedUrl.pathname.split("/");
    console.log( parsedUrl.pathname);

    // some diagnostic logging
    console.log(request.method);
    console.log(path[1]);

    // read body of the request
    var body = "";
    request.on('readable', function() {
        body += request.read();
    });
    
    // when while request received, trigger appropriate service (based on 1st segment of the url)
    request.on('end', function() {
        if ( path[1] == 'registrations' ) registrations(request.method, path, body, response);
    });

}).listen(parameters.port);


// status logging
console.log('Listening on port ' + parameters.port + '...');

