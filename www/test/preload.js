/**
 *
 * Created by wg on 14/11/18.
 */
//web app not load cordova, to disable too many alert when open web
/*
    if(location.protocol != 'http:') {
        $.get("cordova.js", function (data) {
            var oHead = document.getElementsByTagName("head")[0];
            var oScript = document.createElement("script");
            oScript.language = "javascript";
            oScript.type = "text/javascript";
            oScript.id = "cordova_script";
            oScript.defer = true;
            oScript.text = data;
            oHead.appendChild(oScript);
        });
    }

*/

$.get("toload.js", function (data) {
    var oHead = document.getElementsByTagName("head")[0];
    var oScript = document.createElement("script");
    oScript.language = "javascript";
    oScript.type = "text/javascript";
    oScript.id = "cordova_script";
    oScript.defer = true;
    oScript.text = data;
    oHead.appendChild(oScript);
    test();
});
