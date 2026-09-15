import {calcCrow, createMarkerIcon, parseGpxData, replaceLinks} from './MapDataUtils';

export default class Route {
    constructor(config) {
        this.config = config;
        this.heightDiff = 0;
        this.coordinates = [];
        this.altitudes = [];
        this.distances = [];
        this.startMarker = null;
        this.stopMarker = null;
        this.length = 0;
        this.path = null;
        this.segmentLayer = {
            path: null,
            bounds: null
        };
        this.mapPath = null;
        this.clickCb = null;
        this.bounds = L.latLngBounds();

        if(config.description) { this.config.description = replaceLinks(this.config.description); }
        for(let i = 0; i < this.config.segments.length; i++) {
            this.config.segments[i].text = replaceLinks(this.config.segments[i].text);
        }
    }

    getDescription() {
        return this.config.description;
    }

    getLevel() {
        return this.config.level;
    }

    getCurrSegmentBounds() {
        return this.segmentLayer.bounds;
    }

    getSegmentCount() {
        return this.config.segments.length;
    }

    getSegment(idx) {
        if(idx >= 0 && idx < this.config.segments.length) {
            return this.config.segments[idx];
        }
        return null;
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

    parseGpx(xml) {
        Object.assign(this, parseGpxData(xml));
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
            const toStart = calcCrow(lat, lng, this.coordinates[0].lat, this.coordinates[0].lng);
            const toEnd = calcCrow(lat, lng, this.coordinates[this.coordinates.length - 1].lat, this.coordinates[this.coordinates.length - 1].lng)
            return Math.min(toStart, toEnd);
        } else {
            return calcCrow(lat, lng, this.coordinates[0].lat, this.coordinates[0].lng);
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

    removeCurrentSegment(trackLayer, markerLayer) {
        if(this.segmentLayer.path) {
            this.segmentLayer.path.removeFrom(trackLayer);
        }
        this.segmentLayer = {
            path: null,
            bounds: L.latLngBounds()
        };
    }

    renderSegmentMap(idx, trackLayer, markerLayer) {
        this.removeCurrentSegment(trackLayer, markerLayer);
        const segment = this.config.segments[idx];

        const options = {
            color: 'red',
            weight: 4
        };

        const coords = this.coordinates.slice(segment.start, Math.min(segment.stop, this.coordinates.length - 1));
        this.segmentLayer.path = L.polyline(coords, options);
        this.segmentLayer.bounds.extend(coords);
        this.segmentLayer.path.addTo(trackLayer);
    }

    /**
     * Can be re-used, will only generate objects the first time
     */
    renderToMap(trackLayer, markerLayer) {
        if (!this.startMarker) {
            this.startMarker = L.marker(this.coordinates[0], {
                icon: createMarkerIcon('data/imgs/marker_start2.png', [20, 20], [10, 10])
            });
            this.startMarker.on('click', this.pathClicked.bind(this));
            this.startMarker.bindTooltip("Start: " + this.getTitle(),
                    {
                        permanent: false,
                        direction: 'auto'
                    }
            );
            this.startMarker.addTo(markerLayer)
        }

        if(!this.mapPath) {
            const options = {
                color: 'black',
                weight: 7
            };

            this.mapPath = L.polyline(this.coordinates, options);
        }

        this.mapPath.addTo(trackLayer);
    }

}