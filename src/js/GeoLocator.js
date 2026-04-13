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

    updatePosition(pos) {
        this.lastData = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        if(this.mainLocationMarker) {
            this.mainLocationMarker.setLatLng(this.lastData);
            if(this.geoId === null) {
                const closestTrail = this.app.getClosestTrailStart(pos.coords.latitude, pos.coords.longitude);
                this.app.setClosestTrail(closestTrail);
                const nearestName = closestTrail ? closestTrail.getTitle() : "ukjent";
                this.app.showInfo("Posisjon oppdatert<hr>Nærmeste sti: <b>" + nearestName + "</b><br>Klikk her for å åpne.", 6);
            }
        } else {
            const closestTrail = this.app.getClosestTrailStart(pos.coords.latitude, pos.coords.longitude);
            this.app.setClosestTrail(closestTrail);
            const nearestName = closestTrail ? closestTrail.getTitle() : "ukjent";
            this.app.showInfo("Posisjon funnet<hr>Nærmeste sti: <b>" + nearestName + "</b><br>Klikk her for å åpne.", 6);
            this.mainLocationMarker = L.marker(this.lastData, {
                icon: L.icon({
                    iconUrl: 'data/imgs/marker_you.png',
                    iconSize: [40, 40],
                    iconAnchor: [20, 40]
                })
            });
            this.mainLocationMarker.addTo(this.app.getMainMap());
        }

        this.app.getMainMap().flyTo(this.lastData);
    }
}