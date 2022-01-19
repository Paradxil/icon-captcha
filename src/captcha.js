var mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');
var feather = require('feather-icons');
const icons = Object.keys(feather.icons);

const { createCanvas, Image, loadImage } = require("canvas");

const numRects = 15;
const maxWidth = 25;
const minWidth = 16;
const maxHeight = 25;
const minHeight = 16;

//Time until captcha expires in seconds
const TIME_TO_LIVE = 180; //3 Minutes

// Create a scheme for captcha
const captchaSchema = new mongoose.Schema({
    image: {type: String, required: true},
    solution: {type: String, required: true},
    attempt: {type: String}
},
{ timestamps: true });

captchaSchema.index({createdAt: 1},{expireAfterSeconds: TIME_TO_LIVE});

captchaSchema.plugin(encrypt, { secret: process.env.SECRET, excludeFromEncryption: ['createdAt']});

// Create a model for captcha
const Captcha = mongoose.model('Captcha', captchaSchema);

async function getCaptcha(id) {
    if(id === null || id === undefined || id.length <= 0) {
        return;
    }
    return await Captcha.findOne({_id: id});
}

async function deleteCaptcha(id) {
    if(id === null || id === undefined || id.length <= 0) {
        return;
    }
    return await Captcha.deleteOne({_id: id});
}

module.exports.generateCaptcha = async function(width = 300, height = 200) {
    try {
        let imageData = await generateImage(width, height);

        if(imageData == null || imageData.image == null) {
            return null;
        }

        // Calculate the captcha solution.
        // Use percent of width and height to allow for image resizing on the front end.
        let solution = {
            x: imageData.iconPos.x/width,
            y: imageData.iconPos.y/height,
            w: imageData.iconPos.w/width,
            h: imageData.iconPos.h/height
        };

        let captcha = new Captcha({
            image: imageData.image,
            solution: JSON.stringify(solution)
        });

        await captcha.save();

        return {
            image: captcha.image,
            id: captcha._id,
            expires: Date.now()/1000 + (TIME_TO_LIVE - 30) //Subtract 30 seconds to allow a buffer for checking the captcha
        }
    }
    catch(err) {
        console.log(err);
    }

    return null;
}

module.exports.attemptCaptcha = async function(attempt, id) {
    let captcha = await getCaptcha(id);
    if(captcha !== null) {
        if(captcha.attempt === null || captcha.attempt === undefined) {
            captcha.attempt = attempt;
            await captcha.save();
        }

        let verified = await module.exports.verifyCaptcha(id, false);
        return {
            verified: verified,
            submit: true
        };
    }
    return {
        verified: false,
        submit: false
    }
}

/**
 * 
 * @param {*} id The id of the captcha
 * @param {Boolean} remove Default: true. Whether or not to remove the captcha after verification. Should be true.
 * @returns {Boolean} Was the captcha successfully completed.
 */
module.exports.verifyCaptcha = async function(id, remove=true) {
    try {
        let captcha = await getCaptcha(id);

        if(captcha !== null) {
            if(remove) {
                deleteCaptcha(id);
            }
        
            let solution = JSON.parse(captcha.solution);
            let attempt = JSON.parse(captcha.attempt);

            if(attempt && solution && attempt.x && attempt.y && solution.x && solution.y && solution.w && solution.h) {
                if(attempt.x >= solution.x && attempt.y >= solution.y && attempt.x <= solution.x + solution.w && attempt.y <= solution.y + solution.h) {
                    return true;
                }
            }
        }
    }
    catch (err) {
        console.log(err);
        throw err;
    }
    return false;
}

/**
 * 
 * @param {*} width width of image
 * @param {*} height height of image
 */
 function addRandomRectangle(ctx, width, height) {
    let w = Math.floor((Math.random() * (maxWidth - minWidth)) + minWidth);
    let h = Math.floor((Math.random() * (maxHeight - minHeight)) + minHeight);
    let x = Math.floor((Math.random() * (width - w)) + 1);
    let y = Math.floor((Math.random() * (height - h)) + 1);
    addRectangle(ctx, x, y, w, h);

    return {
        x: x, 
        y: y, 
        w: w, 
        h: h
    };
}

function addRandomSquare(ctx, width, height) {
    let w = Math.floor((Math.random() * (maxWidth - minWidth)) + minWidth);
    let x = Math.floor((Math.random() * (width - w)) + 1);
    let y = Math.floor((Math.random() * (height - w)) + 1);
    addRectangle(ctx, x, y, w, w);

    return {
        x: x, 
        y: y, 
        w: w, 
        h: w
    };
}

function addRectangle(ctx, x, y, w, h) {
    ctx.fillRect(x, y, w, h);
}


async function addRandomIcon(ctx, width, height) {
    let w = Math.floor((Math.random() * (maxWidth - minWidth)) + minWidth);
    let x = Math.floor((Math.random() * (width - w)) + 1);
    let y = Math.floor((Math.random() * (height - w)) + 1);
    let icon = icons[Math.floor((Math.random() * icons.length))];
    await addIcon(ctx, icon, x, y, w, w);

    return {
        icon: icon,
        x: x, 
        y: y, 
        w: w, 
        h: w
    };
}

async function addIcon(ctx, icon, x, y, w, h) {
    return new Promise(async (resolve, reject) => {
        let svgimg = feather.icons[icon].toSvg({width: w, height: h});

        const img = new Image();
        img.onload = async () => {ctx.drawImage(img, x, y, w, h);; resolve();};
        img.onerror = err => { reject(err); };
        img.src = Buffer.from(svgimg);
    });
}

async function generateImage(width = 500, height = 300) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const bottomBorder = 25;
    const fontSize = 12;
    const iconSize = 16;

    //Draw white background
    ctx.fillStyle = "#fff";
    addRectangle(ctx, 0, 0, width, height);

    let usedIcons = [];
    for(let i = 0; i < numRects; i++) {
        let data = await addRandomIcon(ctx, width, height - bottomBorder);
        usedIcons.push(data.icon);
    }

    // Stores the location of the correct icon
    let iconPos = {
        icon: null
    };
    
    while(iconPos.icon === null || usedIcons.includes(iconPos.icon)) {
        iconPos = await addRandomIcon(ctx, width, height - bottomBorder);
    }

    ctx.fillStyle = "#f1f1f1";
    addRectangle(ctx, 0, height-bottomBorder, width, bottomBorder);

    ctx.font = '12px "Sans Serif"'
    ctx.fillStyle = "#000";
    ctx.fillText('Click/tap the matching icon:', fontSize, height-((bottomBorder - fontSize)/2));
    await addIcon(ctx, iconPos.icon, width - 2*iconSize, height-iconSize - ((bottomBorder - iconSize)/2), iconSize, iconSize);

    return {
        image: canvas.toDataURL(),
        iconPos: iconPos
    };
}
