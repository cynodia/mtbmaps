import mobile from 'is-mobile';

export default class Trail {
    constructor(config, levelColors, id, infoWindow) {
        this.config = config;
        this.id = id;
        this.heightDiff = 0;
        this.coordinates = [];
        this.altitudes = [];
        this.distances = [];
        this.startMarker = null;
        this.stopMarker = null;
        this.length = 0;
        this.path = null;
        this.mapPath = null;
        this.infoPath = null;
        this.decoration = null;
        this.clickCb = null;
        this.levelColors = levelColors;
        this.bounds = L.latLngBounds();
        this.infoWindow = infoWindow;
        this.infoTimeout = null;
        //this.config.title = this.config.url;

        if(config.findStartText) { config.findStartText = this.replaceLinks(config.findStartText); }
        if(config.infoText) { config.infoText = this.replaceLinks(config.infoText); }
    }

    replaceLinks(str) {
        const replacePattern = /\[(.*?)\]/gim;
        try {
            return str.replace(replacePattern, '<a href=\'#\' onclick=\'openTrailByName("$1")\'>$1</a>');
        } catch(e) {
            console.error(e);
            return str;
        }
    }

    isBidirectional() {
        return this.config.bidirectional;
    }

    getId() {
        return this.id;
    }

    getInfoText() {
        return this.config.infoText;
    }

    getFindStartText() {
        return this.config.findStartText;
    }

    getStartImage() {
        if(!this.config.images.trailStart) {
            return null;
        }
        return "data/pics/" + this.config.images.trailStart;
    }

    getLevel() {
        return this.config.level;
    }

    getTitle() {
        return this.config.title;
    }

    getHeightDiff() {
        return this.heightDiff;
    }

    getCoords() {
        return this.coordinates;
    }

    getAltitudes() {
        return this.altitudes;
    }

    getDistances() {
        return this.distances;
    }

    getLength() {
        return this.length;
    }

    getTrailColor() {
        if(this.config.level === 0) {
            return 'gray';
        }
        if(window.printRender) {
            return 'black';
        }
        if(this.levelColors.hasOwnProperty(this.config.level)) {
            return this.levelColors[this.config.level];
        }
        return 'gray';
    }

    getLevelAsText() {
        switch(this.config.level) {
            case 2:
                return 'Middles';
            case 3:
                return 'Høy';
            default:
                return 'Lav';
        }
    }

    getBounds() {
        return this.bounds;
    }

    //This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
    calcCrow(lat1, lon1, lat2, lon2) {
        function toRad(v) { return (v * Math.PI / 180); }

        const R = 6371; // km
        const dLat = toRad(lat2-lat1);
        const dLon = toRad(lon2-lon1);
        lat1 = toRad(lat1);
        lat2 = toRad(lat2);

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return ((R * c) * 1000);
    }

    parseGpx(xml) {
        let lowest = null;
        let highest = null;
        if(typeof xml === 'string') {
            xml = (new DOMParser()).parseFromString(xml, "text/xml");
        }

        $(xml).find('gpx').each((idx, elem) => {
            $(elem).find('trk').each((idx, elem) => {
                let lastLat = null;
                let lastLng = null;
                $(elem).find('trkseg').each((idx, elem) => {
                    $(elem).find('trkpt').each((idx, elem) => {
                        const lat = parseFloat($(elem).attr('lat'));
                        const lng = parseFloat($(elem).attr('lon'));
                        this.coordinates.push(
                                {
                                    lat: lat,
                                    lng: lng
                                }
                        );
                        const dist = lastLat === null ? 0 : this.calcCrow(lastLat, lastLng, lat, lng);
                        this.distances.push(dist);
                        this.length += (Math.floor(dist) / 1000);
                        this.bounds.extend(L.latLng(lat, lng));
                        lastLat = lat;
                        lastLng = lng;
                        let alt = 0.0;
                        $(elem).find('ele').each(function (idx, elem) {
                            alt = parseFloat($(elem).text());
                            if (lowest === null) {
                                lowest = highest = alt;
                            } else if (lowest > alt) {
                                lowest = alt;
                            } else if (highest < alt) {
                                highest = alt;
                            }
                        });
                        this.altitudes.push(alt);
                    });
                });
            });
        });
        this.heightDiff = highest - lowest;
    }

    loadTrail() {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "GET",
                url: this.config.url,
                cache: false,
                dataType: "xml",
                success: (xml) => {
                    this.parseGpx(xml);
                    resolve(this);
                },
                error: () => {
                    console.error("Could not load trail info from " + this.config.url);
                    reject(this);
                }
            });
        });
    }

    distanceTo(lat, lng) {
        if(this.config.bidirectional) {
            const toStart = this.calcCrow(lat, lng, this.coordinates[0].lat, this.coordinates[0].lng);
            const toEnd = this.calcCrow(lat, lng, this.coordinates[this.coordinates.length - 1].lat, this.coordinates[this.coordinates.length - 1].lng)
            return Math.min(toStart, toEnd);
        } else {
            return this.calcCrow(lat, lng, this.coordinates[0].lat, this.coordinates[0].lng);
        }
    }

    pathClicked() {
        if(this.clickCb) {
            this.clickCb(this);
        }
    }

    removeFrom(layer, markerLayer) {
        if(this.startMarker) {
            this.startMarker.removeFrom(markerLayer ? markerLayer : layer);
        }
        this.mapPath.removeFrom(layer);
    }

    displayToolTip() {
        if(this.config.title != null) {
            this.mapPath.unbindTooltip();
            this.mapPath.bindTooltip(this.getTitle(),
                    {
                        permanent: true,
                        direction: 'auto',
                        interactive: true,
                        opacity: 0.7
                    }
            );
        }
    }

    removeToolTip() {
        if(this.config.title != null) {
            this.mapPath.unbindTooltip();
        }
    }

    /**
     * Can be re-used, will only generate objects the first time
     */
    renderToMap(trackLayer, markerLayer, callback, userUpload) {
        if(!window.printRender && this.config.bidirectional === false) {
            if (!this.startMarker) {
                this.startMarker = L.marker(this.coordinates[0], {
                    icon: L.icon({
                        iconUrl: 'data/imgs/marker_start2.png',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                });
                this.startMarker.on('click', this.pathClicked.bind(this));
                this.startMarker.bindTooltip("Start: " + this.getTitle(),
                        {
                            permanent: false,
                            direction: 'auto'
                        }
                );

            }
            this.startMarker.addTo(markerLayer)
        }

        if(!this.mapPath) {
            const options = {
                color: this.getTrailColor(),
                weight: userUpload ? 4 : (window.printRender ? 7 : 5)
            };
            if(!window.printRender) {
                options['dashArray'] = userUpload ? "" : "14 8";
            }

            this.mapPath = L.polyline(this.coordinates, options);

            if(this.config.title != null) {

                this.mapPath.on('click', this.pathClicked.bind(this));

                if (!mobile()) {
                    const displayInfoWindow = (e) => {
                        this.infoWindow.remove();
                        this.infoTimeout = setTimeout(() => {
                            this.infoTimeout = null;
                            this.infoWindow.setLatLng(e.latlng);
                            this.infoWindow.setContent("<b>" + this.getTitle() + "</b>" +
                                    "<br>Lengde: <b>" + Math.floor(this.getLength() * 10000) / 10 + "m" + "</b>" +
                                    "<br>Høydeforskjell: <b>" + (Math.floor(this.getHeightDiff() * 10) / 10) + "m" + "</b>" +
                                    "<br>Vanskelighetsgrad: <b>" + this.getLevelAsText() + "</b>" +
                                    "<br>Enveis: <b>" + (this.isBidirectional() ? "Nei" : "Ja") + "</b>" +
                                    "<br>" + this.getInfoText() +
                                    "<br><b>Klikk på stien for mer informasjon</b>");
//                                    "<br><span style=\"float:right;\"><a href=\"#\" onclick=\"openTrail(" + this.getId() + ");return false;\">Åpne</a></span><br>");
                            this.infoWindow.openOn(application.lMap);
                        }, 600);
                    };
                    const hideInfoWindow = () => {
                        if (this.infoTimeout) {
                            clearTimeout(this.infoTimeout);
                            this.infoTimeout = null;
                        }
                        this.infoWindow.remove();
                    };
                    this.mapPath.on('mouseover', displayInfoWindow);
                    this.mapPath.on('mouseout', hideInfoWindow);
                }
            }
        }
        //this.mapPath.setText(this.getTitle() + "                   ", { repeat: true, attributes: { x: 10 }});
        this.mapPath.addTo(trackLayer);
        this.clickCb = callback;
    }

    /**
     * Can be re-used, will only generate objects the first time
     */
    renderToTrackInfo(layer, userUpload) {

        if(!this.infoPath) {
            const options = {
                color: this.getTrailColor(),
                weight: userUpload ? 4 : (window.printRender ? 7 : 5),
                dashArray: "14 8"
            };

            this.infoPath = L.polyline(this.coordinates, options);
        }

        this.infoPath.addTo(layer);
    }

    removeFromTrackInfo(layer) {
        this.infoPath.removeFrom(layer);
    }

}