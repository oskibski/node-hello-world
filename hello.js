var http = require('http');
var fs = require('fs');
var parameters = require('./params.js');
var nodemailer = require('nodemailer');
var url = require("url");
var c = require("./credentials.js");

function newRegistration(query, response) {

    var content = "";
    content += "Imię i nazwisko: " + query.name + "\n";
    content += "Adres email: " + query.email + "\n";
    content += "Numer telefonu: " + query.phone + "\n";
    content += "Typ passa: " + query.passType + "\n";
    content += "Uwagi: " + query.comments + "\n";

    var log = JSON.stringify({
        timestamp: new Date().toLocaleString(),
        content: query
    });

    fs.appendFile('registrations.log', log + ",\n", function (err) {
        if (err) return console.log(err);
        console.log('Success!');
    });

    // create reusable transporter object using the default SMTP transport
    var transporter = nodemailer.createTransport('smtps://' + c.login + ':' + c.pass + '@smtp.wp.pl');
    
    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"WBMU! Website" <oas@wp.pl>', // sender address
        to: parameters.recipient, // list of receivers
        subject: 'Rejestracja: ' + query.name, // Subject line
        encoding: 'utf-8',
        text: content // plaintext body
//            html: content // html body
    };
    
    if (query.name == 'test') mailOptions.to = 'Olgierd Skibski <o.skibski@gmail.com>';

    // send mail with defined transport object
    // transporter.sendMail(mailOptions, function (error, info) {
    //     if (error) {
    //         return console.log(error);
    //     }
    //     console.log('Message sent: ' + info.response);
    // });

    response.writeHead(parameters.ok);
    response.end();
}

function registrations(query, response) {

    var regsText = fs.readFileSync("registrations.log");

    var regs = JSON.parse("[" + regsText + "{}]");
    regs.pop();
    console.log(JSON.stringify(regs));

    response.writeHead(parameters.ok);
    response.write(JSON.stringify(regs));
    response.end();
}

http.createServer(function (request, response) {

    var parsedUrl = url.parse(request.url, true); // true to get query as object
    var queryAsObject = parsedUrl.query;
    console.log(JSON.stringify(queryAsObject));
    var serviceName = parsedUrl.pathname;
    
    console.log(serviceName);

    if ( serviceName == '/newRegistration' ) newRegistration(queryAsObject, response);
    if ( serviceName == '/registrations' ) registrations(queryAsObject, response);

}).listen(parameters.port);

console.log('Listening on port ' + parameters.port + '...');

