# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development

```bash
npm run build-dev      # Development build with source maps
npm run build-prod     # Production build (minified)
npm run serve-dev      # Dev server at http://localhost:8070 with hot reload
npm run deploy-prod    # Production build + deploy via stage_and_deploy.sh
```

The `NODE_OPTIONS=--openssl-legacy-provider` flag is already baked into all scripts to handle the Webpack 4 / Node 17+ OpenSSL incompatibility. No manual workaround needed.

There are no tests or linting configured.

## Architecture

This is a **fully static** MTB trail mapping web app — no server-side logic. The built output in `dist/` is a self-contained directory that can be served from any static host.

### Data flow

All trail/route/area configuration lives in **`src/js/Config.js`** (a large ~4000-line file). It exports an object keyed by area name (e.g. `tungvekter`, `asbie`, `myra`). Each area entry contains:
- `main` — title, center coords, info text
- `trails[]` — array of trail configs (title, GPX URL, level 1/2/3, bidirectional, images, infoText, findStartText)
- `routes[]` — suggested tour routes with segments
- `markers{}` — POI markers (parking, points of interest)

**Adding a new trail area:** add an entry to `Config.js`, place GPX files under `data/trails/{area}/`, and images under `data/pics/{area}/`.

### Class structure

- **`MtbMapApplication`** — central controller. Owns both Leaflet maps, all layers, menus, and wires everything together. Instantiated as `window.application` from `app.js`.
- **`Trail`** — loads a GPX file via jQuery AJAX, parses it, renders to the main map and/or trail detail mini-map. One instance per trail config entry.
- **`Route`** — same GPX loading as Trail, but represents a multi-segment suggested tour with step-by-step navigation.
- **`GeoLocator`** — wraps `navigator.geolocation`, places a marker, and calls back into `MtbMapApplication` to highlight the nearest trail.

### Two-map layout

There are two Leaflet map instances:
- **`lMap`** (`#lmap`) — the main interactive map. Tile layers (topo/satellite/heatmap) and trail polylines live here. Layer visibility is zoom-dependent: title markers shown below zoom 13, track polylines from zoom 13+, start markers from zoom 15+.
- **`trailMap`** (`#trailmap`) — the small map inside the trail detail panel. Shows only the selected trail's polyline.

### Tile sources

- **Topo (default):** `https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png` (Kartverket — note `{y}/{x}` order, WMTS convention)
- **Satellite overlay:** ArcGIS World Imagery
- **Heatmap overlay:** Strava ride heatmap

### Trail levels

- `0` — road/path (gray, not selectable in geolocation nearest-trail search)
- `1` — easy (green `#090`)
- `2` — medium (blue `#66f`)
- `3` — hard (red `#f00`)

### URL parameters

- `?c={areaKey}` — pre-selects an area on load (e.g. `?c=tungvekter`)
- `#N` — opens trail with index N in the global trails array (set by the app when a trail is clicked)
- `?printRender=true` — switches to print-friendly rendering (black trails, heavier weight)

### External dependencies loaded outside the bundle

jQuery and `vis.js` (for 2D/3D elevation charts) are loaded as globals in `index.html` — they are not npm packages and not imported in the JS modules. `$` and `vis` are used as globals throughout the codebase.
