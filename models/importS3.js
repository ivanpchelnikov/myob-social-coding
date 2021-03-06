var sys = require('sys'),
    http = require('http'),
    url = require('url'),
    fs = require('fs'),
    path = require('path'),
    io = require('socket.io').listen(app),
    uuid = require('node-uuid'),
    query = require('array-query'),
    async = require('async')
   ,exec = require("child_process").exec;

//    ,redisUtil = require('../common/redisutil');

//var Business = require('../models/business'),
//    BusinessTaxReturn = require('../models/businesstaxreturn'),
//    Employee = require('../models/employee'),
//    FinancialYear = require('../models/financialyear'),
//    Individual = require('../models/individual'),
//    IndividualRelation = require('../models/individualrelation'),
//    IndividualStock = require('../models/individualstock'),
//    IndividualTaxReturn = require('../models/individualtaxreturn'),
//    Partner = require('../models/partner'),
//    Referral = require('../models/referral'),
//    Relation = require('../models/relation'),
//    Stock = require('../models/stock');

//TODO: Re-factor this to support multiple requests :)
var thisSocket;
io.sockets.on('connection', function(socket) {
    thisSocket = socket;
});

// Constants
var FILE_DROP = 'temp';
var FILE_EXTENSION = '.zip';

// Public methods
exports.ImportFromS3 = function(callback) {
    sys.puts('Running batch import');

    exec([
        downloadZipFile,
        unzipFilesIn,
        importFilesIn,
        createNodeRelationships
    ], function(error, result) {
        if (error) return callback(error);

        sys.puts('Finished running batch import');
        callback(null);
    });
}

// Private methods
function downloadZipFile(callback) {
    var downloadFileUrlString = "https://s3.amazonaws.com/myobadcodingcompetition/CSV+data.zip";
    var downloadFileUrl = url.parse(downloadFileUrlString);
    var host = downloadFileUrl.hostname;
    var downloadFilename = downloadFileUrl.pathname.split("/").pop();

    var downloadProgress = 0;
    var downloadFilePath = path.join(FILE_DROP, uuid.v1() + FILE_EXTENSION);
    var downloadFile = fs.createWriteStream(downloadFilePath, {
        'flags': 'a'
    });

    var downloadOptions = {
        host: host,
        port: 80,
        path: downloadFileUrl.pathname,
        method: 'GET'
    };

    var request = http.request(downloadOptions, function(response) {
        sys.puts('Downloading file: ' + downloadFilename);
        sys.puts('STATUS: ' + response.statusCode);
        sys.puts('HEADERS: ' + JSON.stringify(response.headers));

        var contentLength = response.headers['content-length'];

        response.setEncoding('binary');
        response.on('data', function(chunk) {
            downloadProgress += chunk.length;
            downloadFile.write(chunk, encoding = 'binary');

            sys.puts('Download progress: ' + downloadProgress + ' bytes');
            if (thisSocket) {
                var progressPercentage = (downloadProgress / contentLength) * 100;
                thisSocket.emit('downloadZipFileProgress', {
                    progress: progressPercentage
                });
            }
        });
        response.on('end', function() {
            downloadFile.end();
            sys.puts('Finished downloading ' + downloadFilename);
            callback(null, downloadFilePath);
        });
    });

    request.on('error', function(e) {
        sys.puts('Problem with request: ' + e.message);
    });

    request.end();
}

//function unzipFilesIn(zipFilePath, callback) {
//    sys.puts('Unzipping file: ' + zipFilePath);
//    if (thisSocket) thisSocket.emit('unzipFileProgress', {
//        progress: 'Unzipping file...'
//    });
//
//    var zipFileName = path.basename(zipFilePath, '.zip');
//    var csvFilesPath = path.join(FILE_DROP, zipFileName);
//
//    var spawn = require('child_process').spawn;
//    var unzip = spawn('unzip', [zipFilePath, '-d', csvFilesPath]);
//
//    unzip.stdout.on('data', function(data) {});
//    unzip.stderr.on('data', function(data) {});
//    unzip.on('exit', function(code) {
//        sys.puts('Finished unzipping ' + zipFilePath);
//        if (thisSocket) thisSocket.emit('unzipFileProgress', {
//            progress: 'Finished unzipping file'
//        });
//
//        callback(null, csvFilesPath);
//    });
//}
//
//function importFilesIn(csvFilesPath, callback) {
//    sys.puts('Importing CSV files');
//    redisUtil.resetTotalNodes();
//
//    Business.loadFromCSV(path.join(csvFilesPath, 'Business.csv'));
//    BusinessTaxReturn.loadFromCSV(path.join(csvFilesPath, 'Business_TaxRecord.csv'));
//    Employee.loadFromCSV(path.join(csvFilesPath, 'Employee.csv'));
//    FinancialYear.loadFromCSV(path.join(csvFilesPath, 'FinancialYear.csv'));
//    Individual.loadFromCSV(path.join(csvFilesPath, 'Individual.csv'));
//    IndividualRelation.loadFromCSV(path.join(csvFilesPath, 'Individual_Relation.csv'));
//    IndividualStock.loadFromCSV(path.join(csvFilesPath, 'Individual_Stock.csv'));
//    IndividualTaxReturn.loadFromCSV(path.join(csvFilesPath, 'Individual_TaxRecord.csv'));
//    Partner.loadFromCSV(path.join(csvFilesPath, 'Partner.csv'));
//    Referral.loadFromCSV(path.join(csvFilesPath, 'Referral.csv'));
//    Relation.loadFromCSV(path.join(csvFilesPath, 'Relation.csv'));
//    Stock.loadFromCSV(path.join(csvFilesPath, 'Stock.csv'));
//
//    var refreshId = setInterval(function() {
//        redisUtil.getTotalNodes(function(err, totalNodes) {
//            if (err) return callback(err);
//
//            if (thisSocket) thisSocket.emit('importCSVProgress', {
//                progress: totalNodes
//            });
//
//            sys.puts('Total node: ' + totalNodes);
//
//            if (totalNodes == 0) {
//                sys.puts('Finished importing CSV files');
//                clearInterval(refreshId);
//                callback(null);
//            }
//        });
//    }, 1000);
//}



