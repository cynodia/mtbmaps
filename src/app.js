import "./css/common.css";
import MtbMapApplication from "./js/MtbMapApplication";
import 'leaflet/dist/leaflet.css';
import mobile from 'is-mobile';
import mmConfigurations from './js/Config';

window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'UA-135266495-1');

function getUrlParameter(sParam) {
    const params = new URLSearchParams(window.location.search);
    if (!params.has(sParam)) {
        return undefined;
    }

    const value = params.get(sParam);
    return value === '' ? true : value;
}

$( function() {
    $('#trailcontent').load('html/trailcontent_' + (mobile() ? 'mobile' : 'desktop') + '.html', () => {
        console.log("Init app");

        $('#closeinfobtn').click(function() {
            $('#infotext').fadeOut(750);
        });

        $('#closehelpbtn').click(function() {
            $('#helptext').fadeOut(750);
        });

        let config = null;

        let urlParam = getUrlParameter("c");
        if(urlParam && mmConfigurations[urlParam]) {
            config = urlParam;
        }

        urlParam = getUrlParameter("printRender");
        if(urlParam && urlParam === "true") {
            window.printRender = true;
        } else {
            window.printRender = false;
        }

        console.log("Using configuration: " + config);
        window.application = new MtbMapApplication(config);

        console.log("Init maps...");
        /* Overrides /addons */
        window.application.initMap();
    });
});
