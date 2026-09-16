import {createMarkerIcon} from './MapDataUtils';

export default class GeoLocator {
    
    constructor(app) {
        this.geoId = null;
        this.app = app;
        this.lastData = null;
        this.mainLocationMarker = null;
        //this.trailLocationMarker = null;
    }

    mapUserLocation() {
        if (navigator.geolocation) {
            if(this.geoId !== null) {
                this.app.showInfo("Oppdaterer din posisjon...", 10);
                navigator.geolocation.clearWatch(this.geoId);
                this.geoId = null;
            } else {
                this.app.showInfo("Henter din posisjon...", 10);
            }
            navigator.geolocation.getCurrentPosition(this.updatePosition.bind(this), this.geolocationFail.bind(this));
        } else {
            this.app.showInfo("Posisjondata ikke tigjengelig!", 6);
        }
    }

    geolocationFail(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                this.app.showInfo("Brukeren avslo forespørsel om posisjon.");
                break;
            case error.POSITION_UNAVAILABLE:
                this.app.showInfo("Posisjonsinformasjon ikke tilgjengelig.");
                break;
            case error.TIMEOUT:
                this.app.showInfo("Tidsavbrudd i forspørsel om posisjon.");
                break;
            default:
                this.app.showInfo("Posisjonsforespørsel: ukjent feil.");
                break;
        }
    }

    showClosestTrailInfo(latitude, longitude, message) {
        const closestTrail = this.app.getClosestTrailStart(latitude, longitude);
        this.app.setClosestTrail(closestTrail);
        const nearestName = closestTrail ? closestTrail.getTitle() : "ukjent";

        this.app.showInfo(message + "<hr>Nærmeste sti: <b>" + nearestName + "</b><br>Klikk her for å åpne.", 6);
    }

    updatePosition(pos) {
        const {latitude, longitude} = pos.coords;
        const hadMarker = Boolean(this.mainLocationMarker);
        const showNearestTrail = !hadMarker || this.geoId === null;
        this.lastData = {lat: latitude, lng: longitude};

        if(hadMarker) {
            this.mainLocationMarker.setLatLng(this.lastData);
        } else {
            this.mainLocationMarker = L.marker(this.lastData, {
                icon: createMarkerIcon('data/imgs/marker_you.png', [40, 40], [20, 40])
            });
            this.mainLocationMarker.addTo(this.app.getMainMap());
        }

        if (showNearestTrail) {
            this.showClosestTrailInfo(latitude, longitude, hadMarker ? "Posisjon oppdatert" : "Posisjon funnet");
        }

        this.app.getMainMap().flyTo(this.lastData);
    }
}