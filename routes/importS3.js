var importS3 = require('../models/importS3');


function ImportFromS3 (req, res, next) {

//      importS3.ImportFromS3(function(error) {
//        if (error) return next(error);
//         });

    res.writeHead(200, {"Content-Type": "text/plain"});
    res.write("Hello Ivan !!!");
    res.end();

   // res.render('ImportStatus');

 };
exports.ImportFromS3=ImportFromS3;