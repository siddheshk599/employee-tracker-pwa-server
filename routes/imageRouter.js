let express = require('express');
let bodyParser = require('body-parser');
let fs = require('fs');
let functions = require('../shared/functions');
let cors = require('./cors');
let authenticate = require('../authenticate');

let imageRouter = express.Router();

imageRouter.use(bodyParser.json({
    extended: true,
    limit: '50mb'
}));

// '/image' route
imageRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`GET operation is not supported on /image.`);
})
.put(cors.corsWithOptions, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation is not supported on /image.`);
})
.post(cors.corsWithOptions, (req, res, next) => {
    if (req.query['folderName']) {
        let fileSavePath = `${process.cwd()}/public/pictures/${req.query['folderName']}/${req.body.outputFileName}`;

        fs.writeFile(fileSavePath, req.body.base64Data, { encoding: 'base64' }, (error) => {
            if (error) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    success: false,
                    error: error
                });
            } else {
                if (fs.existsSync(fileSavePath)) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({
                        success: true,
                        imagePath: `${process.env.SERVER_BASE_URL}/pictures/${req.query['folderName']}/${req.body.outputFileName}`
                    });
                } else {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({
                        success: false,
                        error: new Error('Error in saving the image.')
                    });
                }    
            }
        });
    } else {
        let error = functions.errorGeneration('Folder Name not specified in the request.', 404);
        return next(error);
    }
})
.delete(cors.corsWithOptions, authenticate.verifyEmployee, authenticate.verifyEitherAdminManager, (req, res, next) => {
    if (req.query['path']) {
        let imagePath = process.cwd() + '/public' + decodeURIComponent(req.query['path']).split(
            process.env.SERVER_BASE_URL.includes('localhost') ? 'localhost:3000' : 'impresent.in'
        )[1];

        if (fs.existsSync(imagePath)) {
            fs.unlink(imagePath, (error) => {
                if (error) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({
                        success: false,
                        error: error
                    });

                } else {
                    if (fs.existsSync(imagePath)) {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({
                            success: false,
                            error: new Error('Error in deleting the image.')
                        });

                    } else {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({
                            success: true
                        });
                    }
                }
            });
        } else {
            let error = functions.errorGeneration('Specified image path not found.', 404);
            return next(error);
        }

    } else {
        let error = functions.errorGeneration('Image Path not specified in the request.', 404);
        return next(error);
    }
});

module.exports = imageRouter;