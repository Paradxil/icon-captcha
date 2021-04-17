require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");

const { configure } = require("lasso");
const { serveStatic } = require("lasso/middleware");
const markoExpress = require("@marko/express").default;
require("marko/node-require"); // Allow Node.js to require and load `.marko` files

var fs = require('fs');

var mongoose = require('mongoose');
const { generateCaptcha, attemptCaptcha, verifyCaptcha } = require("./captcha.js");

const captchaTemplate = require("../components/template.marko").default;

// Connect to database
mongoose.connect('mongodb://' + process.env.DATABASEHOST + '/' + process.env.DATABASE, {
    useNewUrlParser: true,
    maxPoolSize: 25,
    useUnifiedTopology: true
});

// Configure lasso to control how JS/CSS/etc. is delivered to the browser
const isProduction = true; //process.env.NODE_ENV === "production";
configure({
    plugins: [
        {
            "plugin": "lasso-marko",
            "config": {
                "useCache": false
            }
        }
    ],
    minify: isProduction, // Only minify JS and CSS code in production
    bundlingEnabled: isProduction, // Only enable bundling in production
    fingerprintsEnabled: isProduction // Only add fingerprints to URLs in production
});


const port = 3000;
const app = express();
app.use(markoExpress()); //enable res.marko(template, data)
app.use(serveStatic()); // Serve static assets with lasso)

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.get('/captcha', async (req, res) => {
    res.marko(captchaTemplate, {host:process.env.HOST});
});

app.get('/captcha/img', async (req, res) => {
    let captcha = await generateCaptcha(300, 100);
    res.send({captchaid: captcha.id, img: captcha.image, expires: captcha.expires});
});

app.post('/captcha', async (req, res) => {
    if(req.body === null || req.body.x === null || req.body.y === null) {
        res.sendStatus(500);
    } 

    let attempt = {
        x: req.body.x,
        y: req.body.y
    };

    let result = await attemptCaptcha(JSON.stringify(attempt), req.body.id);

    if(result) {
        res.sendStatus(200);
    }
    else {
        res.sendStatus(404);
    }
});

app.post('/captcha/verify', async (req, res) => {
    if(req.body === null || req.body.id === null) {
        res.sendStatus(500);
    } 

    let verified = await verifyCaptcha(req.body.id||null);
    res.send({
        verified: verified
    });
});

let apiFile = fs.readFileSync(__dirname + "/../resources/api.js", {encoding:'utf8'});
apiFile = apiFile.replace("{{HOST}}", process.env.HOST);

app.get('/captcha/api.js', (req, res) => {
    res.send(apiFile);
});


app.listen(process.env.PORT, () => {
    console.log(`Captcha listening at http://localhost:${process.env.PORT}`);
});