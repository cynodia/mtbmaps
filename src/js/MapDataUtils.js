import L from 'leaflet';

const EARTH_RADIUS_KM = 6371;
const LINK_PATTERN = /\[(.*?)\]/gim;

function toRadians(value) {
    return value * Math.PI / 180;
}

function parseXml(xml) {
    if (typeof xml === 'string') {
        return (new DOMParser()).parseFromString(xml, "text/xml");
    }
    return xml;
}

export function replaceLinks(str) {
    try {
        return str.replace(LINK_PATTERN, '<a href=\'#\' onclick=\'openTrailByName("$1")\'>$1</a>');
    } catch (e) {
        console.error(e);
        return str;
    }
}

export function calcCrow(lat1, lon1, lat2, lon2) {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const normalizedLat1 = toRadians(lat1);
    const normalizedLat2 = toRadians(lat2);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(normalizedLat1) * Math.cos(normalizedLat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (EARTH_RADIUS_KM * c) * 1000;
}

export function createMarkerIcon(iconUrl, iconSize, iconAnchor) {
    return L.icon({
        iconUrl,
        iconSize,
        iconAnchor
    });
}

export function parseGpxData(xml) {
    const document = parseXml(xml);
    const bounds = L.latLngBounds();
    const coordinates = [];
    const altitudes = [];
    const distances = [];
    let lowest = null;
    let highest = null;
    let lastLat = null;
    let lastLng = null;
    let length = 0;

    document.querySelectorAll('trkpt').forEach((trackPoint) => {
        const lat = parseFloat(trackPoint.getAttribute('lat'));
        const lng = parseFloat(trackPoint.getAttribute('lon'));
        const elevation = trackPoint.querySelector('ele');
        const altitude = elevation ? parseFloat(elevation.textContent) : 0;
        const distance = lastLat === null || lastLng === null ? 0 : calcCrow(lastLat, lastLng, lat, lng);

        coordinates.push({lat, lng});
        distances.push(distance);
        altitudes.push(altitude);
        length += Math.floor(distance) / 1000;
        bounds.extend(L.latLng(lat, lng));

        lastLat = lat;
        lastLng = lng;

        if (lowest === null || altitude < lowest) {
            lowest = altitude;
        }
        if (highest === null || altitude > highest) {
            highest = altitude;
        }
    });

    return {
        coordinates,
        altitudes,
        distances,
        length,
        bounds,
        heightDiff: lowest === null || highest === null ? 0 : highest - lowest
    };
}
