/**
 *
 * Created by wg on 14/11/18.
 */
//web app not load cordova, to disable too many alert when open web
    if(location.protocol == 'http:') {
        $.get("cordova.js", function (data) {
            var preload_script = $("#preload_script");
            var oScript = document.createElement("script");
            oScript.language = "javascript";
            oScript.type = "text/javascript";
            oScript.id = "cordova_script";
            oScript.defer = true;
            oScript.text = data;
            preload_script.after(oScript);
        });
    }

