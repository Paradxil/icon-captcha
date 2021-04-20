# Icon Captcha
Icon Captcha is a simple captcha implementation using NodeJS. 

## Our Goal
Our goal was to create an easy to use captcha for use with contact forms and other low risk applications. 
This captcha was not designed to be extremely secure, but rather as a simple way to block spam form submissions.

## Use Cases
This captcha is easy for the end user to complete and easy for developers to implement. 
Only a few lines of code are needed to add the captcha to a form and verify the captcha once submit.

Like most captchas, this captcha is not meant to be the primary security measure for an application. 

The primary use case is to block spam submissions on contact us forms and similar applications.

## Getting Started
You can host Icon Captcha yourself or use our hosted service at iconcaptcha.com. Click here for instructions on hosting Icon Captcha.

The following instructions explain how to set up Icon Captcha using iconcaptcha.com

##### Step 1: Link to the front end api
To get started add the following link to your `head` tag.

```
<script src="https://iconcaptcha.com/captcha/api.js" async defer></script>
```

##### Step 2: Add the captcha to your form
Add the following `div` tag to your form. Make sure the tag is inside a `form` to have the captcha id be included with the form submission.

```
<div class="icon-captcha"></div>
```
The script included in step one will automatically add the captcha to this tag on page load.

If the captcha does not load automatically in your environment you may need to load the captcha manually. This can happen when you are using a framework, such as VueJS or MarkoJS, that modifies the DOM. Either of these functions will populate "icon-captcha" `div`.
```
window.loadCaptcha();
loadCaptcha();
```
##### Step 4: Obtain the captcha id
Upon successful completion of a captcha, the unique captcha id is stored in a form input. 
You can access the captcha id via the `captchaid` POST parameter upon form submission.

Client side you can also use one of the following functions to obtain the captcha id:
```
window.getCaptchaID();
getCaptchaID();
```

##### Step 3: Verify the captcha server side
Captchas must be verified within 3 minutes of creation and can only be verified once. After verification the captcha is removed from the database. If verification fails the user must submit a new captcha.

To verify a captcha make a post request to `https://iconcaptcha.com/captcha/verify` with the captcha id.

**Verification Request**

URL: `https://iconcaptcha.com/captcha/verify`
METHOD: POST
Parameter | Description
------------ | -------------
id | The unique captcha id, available via the `captchaid` POST parameter upon form submission. 

**Verification Response**

TYPE: JSON
```
{
    verified: boolean
}
```
`verified` is set to *true* for a successful captcha attempt and *false* for an incorrect captcha attempt.

## Examples/Demo
Coming soon

## Self Hosted
Instructions coming soon.


## Author
Hunter Stratton

