let captchaid = null;

window.addEventListener('load', (event) => {
    loadCaptcha();
});

function loadCaptcha() {
    if(!document.getElementById("captcha-textarea")) {
        var ifrm = document.createElement("iframe");
        ifrm.setAttribute("src", "{{HOST}}/captcha");
        ifrm.setAttribute("sandbox", "allow-same-origin allow-scripts");
        ifrm.style.width = "324px";
        ifrm.style.height = "135px";
        ifrm.style.border = "none";

        var textArea = document.createElement("textarea");
        textArea.setAttribute('required', '');
        textArea.setAttribute('aria-required', true);
        textArea.name = "captcha-id";
        textArea.style.display = "none";

        var els = document.getElementsByClassName("captcha");
        
        for(let el of els) {
            textArea.id = "captcha-textarea";
            ifrm.id = "captcha-iframe";
            
            el.appendChild(ifrm);
            el.appendChild(textArea);
        }
    }
}

function getCaptchaID() {
    return captchaid;
}

window.addEventListener("message", (event) => {
    if(event.isTrusted && event.data !== null && event.data.captchaid !== null && event.data.captchaid !== undefined) {
        document.getElementById("captcha-textarea").value=event.data.captchaid;
        captchaid = event.data.captchaid;
    }
  }, false);
