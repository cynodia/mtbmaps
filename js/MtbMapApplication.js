class MtbMapApplication {

    constructor(config) {
        this.config = config;
        this.mainMap = null;
        this.trailMap = null;
        this.infoTimeout = null;
        this.trails = [];
        this.currDetailTrail = null;
        this.show3d = false;
        this.mainBounds = null;
        this.geoLocator = new GeoLocator(this);
        this.closestTrail = null;

        this.updateStaticText();
        $('#closetrailinfo').click(this.closeTrailInfo.bind(this));
        $('#trail3dBtn').click(this.showTrail3d.bind(this));
        $('#trail2dBtn').click(this.showTrail2d.bind(this));
        $('#infopopup').click(this.infoPopupClicked.bind(this));
    }

    updateStaticText() {
        $('#infotextcontent').html(
                this.config.main.infoText +
                "<h2>mtbmaps.net</h2>" +
                "Målet med mtbmaps.net er å tilby en lettvekts webapplikasjon for navigasjon i typiske norske stinettverk som består av flere små segmenter i motsetning til lange sammenhengende løyper. Det er fokus på å kunne finne inngangen på stiene.<br>" +
                "Løsningen skal være enkel å sette opp og krever ingen dynamisk serviersideteknologi.<br>" +
                // "Tilgjengelige områder: <br><ul>" +
                // "<li><a href=\"https://tungvekter.mtbmaps.net\">Arendal - Tungvekteren</a></li>" +
                // "<li><a href=\"https://asbie.mtbmaps.net\">Arendal - Åsbieskogen</a></li>" +
                // "</ul>" +
                "Du kan forke prosjektet på <a href=\"https://github.com/cynodia/ast-maps\">GitHub</a>.<br>" +
                (mobilecheck() ? "Du ser nå på mobilutgaven av webapplikasjonen." : "Du ser nå på desktoputgaven av webapplikasjonen. <a href=\"index_mobile.html\">Mobilversjon</a>")
        );
        if(!mobilecheck()) {
            $('#headertext').html(mobilecheck() ? this.config.main.mainHeaderMobile : this.config.main.mainHeaderDesktop);
        }
    }

    infoPopupClicked() {
        if(this.closestTrail) {
            this.onMapElemClicked(this.closestTrail);
        }
    }

    setClosestTrail(trail) {
        this.closestTrail = trail;
    }

    getMainMap() {
        return this.mainMap;
    }

    getTrailMap() {
        return this.trailMap;
    }

    closeTrailInfo() {
        this.currDetailTrail.renderTo(this.mainMap, this.onMapElemClicked.bind(this));
        this.currDetailTrail = null;
        $("#trailwindow").fadeOut(500);
    }

    hideInfo() {
        if (this.infoTimeout != null) {
            clearTimeout(this.infoTimeout);
        }
        $('#infopopup').fadeOut(500);
    }

    showInfo(message, timeout) {
        if (!timeout) {
            timeout = 4;
        }
        if (this.infoTimeout != null) {
            clearTimeout(this.infoTimeout);
        }

        $('#infopopup').html(message);
        $('#infopopup').fadeIn(500);
        this.infoTimeout = setTimeout(function () {
            $('#infopopup').fadeOut(500);
            this.infoTimeout = null;
        }.bind(this), timeout * 1000)
    }

    initMap() {
        console.log("Setting up maps...");

        this.mainBounds = new google.maps.LatLngBounds();

        this.mainMap = new google.maps.Map(document.getElementById('map'), {
            // zoom: this.config.main.mapZoom,
            // center: this.config.main.mapCenter,
            mapTypeId: 'hybrid',
            mapTypeControl: false,
            disableDefaultUI: true
        });

        this.trailMap = new google.maps.Map(document.getElementById('trailmap'), {
            // zoom: 16,
            // center: this.config.main.mapCenter,
            mapTypeId: 'hybrid',
            mapTypeControl: false,
            disableDefaultUI: true
        });

        /** Add markers */
        for (let key in this.config.markers) {
            if (this.config.markers.hasOwnProperty(key)) {
                new google.maps.Marker({
                    position: this.config.markers[key].position,
                    map: this.mainMap,
                    title: this.config.markers[key].title,
                    icon: this.config.markers[key].icon
                });
                this.mainBounds.extend(new google.maps.LatLng(this.config.markers[key].position.lat, this.config.markers[key].position.lng));

            }
        }

        /** Add trails */
        let trailsToLoad = this.config.trails.length;
        for (let i = 0; i < this.config.trails.length; i++) {
            let t = new Trail(this.config.trails[i], this.config.main.levelColors);
            t.loadTrail(function (trail) {
                trail.renderTo(this.mainMap, this.onMapElemClicked.bind(this));
                this.mainBounds.union(trail.getBounds());
                trailsToLoad--;
                if(trailsToLoad === 0) {
                    console.log("DONE - fit map...");
                    this.mainMap.fitBounds(this.mainBounds, 0);
                }
            }.bind(this));
            this.trails.push(t);
            console.log("Added trail " + t.getTitle());
        }

        this.addHelpOverlays();
        this.hideInfo();
    }

    getClosestTrailStart(lat, lng) {
        let closestDist = this.trails[0].distanceToStart(lat, lng);
        let closestTrail = this.trails[0];
        for(let i = 1; i < this.trails.length; i++) {
            const dist = this.trails[i].distanceToStart(lat, lng);
            if(dist < closestDist) {
                closestDist = dist;
                closestTrail = this.trails[i];
            }
        }
        return closestTrail;
    }

    resetMainMap() {
        this.mainMap.fitBounds(this.mainBounds, 0);
        //
        // this.mainMap.setZoom(this.config.main.mapZoom);
        // this.mainMap.setCenter(this.config.main.mapCenter);
    }

    addHelpOverlays() {
        // Create the DIV to hold the control and call the CenterControl()
        // constructor passing in this DIV.
        const infoDiv1 = document.createElement('div');
        infoDiv1.style.background = "rgba(255,255,255,.6)";
        infoDiv1.style.padding = "6px";
        infoDiv1.style.borderRight = "1px solid white";
        infoDiv1.style.borderBottom = "1px solid white";
        infoDiv1.style.fontSize = "16px";
        infoDiv1.style.borderRadius = "0 0 6px 0";
        infoDiv1.index = 1;
        infoDiv1.innerHTML = "<i style='font-weight:bold; color: " + this.config.main.levelColors[1] + ";' class=\"fa fa-minus\"></i> Lett" +
                "<br><i style='font-weight:bold; color: " + this.config.main.levelColors[2] + ";' class=\"fa fa-minus\"></i> Middels" +
                "<br><i style='font-weight:bold; color: " + this.config.main.levelColors[3] + ";' class=\"fa fa-minus\"></i> Vanskelig" +
                "<hr><i style='color: #ffffff;' class=\"fa fa-circle\"></i> Start";
        if(mobilecheck()) {
            infoDiv1.innerHTML += "<br><i style='color: #f00;' class='fa fa-circle'></i> Deg";
        }

        this.mainMap.controls[google.maps.ControlPosition.TOP_LEFT].push(infoDiv1);

        const btnDiv = document.createElement('div');

        if(mobilecheck()) {
            const infoButton = document.createElement('button');
            infoButton.style.background = "rgba(255,255,255,.6)";
            infoButton.style.padding = "12px";
            infoButton.style.marginRight = "10px";
            infoButton.style.fontSize = "16px";
            infoButton.style.cursor = "pointer";
            infoButton.setAttribute("class", "topButton");
            infoButton.index = 3;
            infoButton.innerHTML = "<i style=\"cursor:pointer; font-size: 34px;\" class=\"fa fa-info-circle\"></i>";
            infoButton.onclick = function() {
                $('#infotext').fadeIn(500, function() {
                    $("html, body").animate({scrollTop: 0}, "slow");
                });
            };

            btnDiv.appendChild(infoButton);

            const locationButton = document.createElement('button');
            locationButton.style.background = "rgba(255,255,255,.6)";
            locationButton.style.padding = "12px";
            locationButton.style.marginRight = "10px";
            locationButton.style.fontSize = "16px";
            locationButton.style.cursor = "pointer";
            locationButton.setAttribute("class", "topButton");
            locationButton.index = 2;
            locationButton.innerHTML = "<i style=\"cursor:pointer; font-size: 34px;\" class=\"fa fa-crosshairs\"></i>";
            locationButton.onclick = function () {
                this.geoLocator.mapUserLocation();
            }.bind(this);

            btnDiv.appendChild(locationButton);
        }


        const reloadButton = document.createElement('button');
        reloadButton.style.background = "rgba(255,255,255,.6)";
        reloadButton.style.padding = "12px";
        reloadButton.setAttribute("class", "topButton");
        reloadButton.style.fontSize = "16px";
        reloadButton.style.cursor = "pointer";
        reloadButton.innerHTML = "<i style=\"cursor:pointer; font-size: 34px;\" class=\"fa fa-home\"></i>";
        reloadButton.onclick = this.resetMainMap.bind(this);

        btnDiv.appendChild(reloadButton);

        this.mainMap.controls[google.maps.ControlPosition.TOP_RIGHT].push(btnDiv);
    }

    generateGraph3d(trail) {
        const data = new vis.DataSet();
        const coords = trail.getCoords();
        const alts = trail.getAltitudes();
        let counter = 0;

        for(let i = 0; i < coords.length; i++) {
            data.add({
                id: counter++,
                x: coords[i].lng,
                y: coords[i].lat,
                z: alts[i],
                style: 50
            });
        }

        // specify options
        const options = {
            width: '100%',
            height: '100%',
            style: 'bar-size',
            showPerspective: true,
            showGrid: false,
            showShadow: false,
            keepAspectRatio: true,
            verticalRatio: trail.getHeightDiff() < 10 ? 0.1 : 0.2,
            xBarWidth: 0.0003,
            yBarWidth: 0.0003,
            xLabel: '',
            yLabel: '',
            zLabel: 'moh',
            xValueLabel: function (x) {
                return "";
            },
            yValueLabel: function (y) {
                return "";
            }
        };

        new vis.Graph3d(document.getElementById('trailchart'), data, options);
    }

    generateGraph2d(trail) {
        const data = new vis.DataSet();
        const alts = trail.getAltitudes();
        const dists = trail.getDistances();
        let curr = 0;

        for(let i = 0; i < alts.length; i++) {
            curr += dists[i];
            data.add({
                x: curr,
                y: alts[i]
            });
        }

        const options = {
            width: '100%',
            height: '100%',
            moveable: false,
            zoomable: false,
            drawPoints: false,
            style: 'bar',
            showMajorLabels: false
            // start: '0',
            // end: alts.length
        };
        new vis.Graph2d(document.getElementById('trailchart'), data, options);
    }

    showTrail3d() {
        this.show3d = true;
        $('#trail3dBtn').hide();
        $('#trail2dBtn').show();
        if(!this.currDetailTrail) {
            return;
        }
        $("#trailchart").empty();
        this.generateGraph3d(this.currDetailTrail);
    }

    showTrail2d() {
        this.show3d = false;
        $('#trail3dBtn').show();
        $('#trail2dBtn').hide();
        if(!this.currDetailTrail) {
            return;
        }
        $("#trailchart").empty();
        this.generateGraph2d(this.currDetailTrail);
    }

    onMapElemClicked(trail) {
        this.currDetailTrail = trail;

        //$("html, body").animate({ scrollTop: 0 }, "slow");

        $("#trailinfoheader").html(trail.getTitle());
        $("#trailchart").empty();

        //const coords = trail.getCoords();
        //this.trailMap.setCenter(new google.maps.LatLng(coords[0].lat, coords[0].lng));

        //let info = "<img width=\"100%\" align=\"center\" src=\"data/pics/" + trailData[key].images.trailStart + "\"/><br>";
        let info = "<img class=\"shadowed\" width=\"100%\" align=\"center\" src=\"data/pics/start.jpg" + "\"/><br>";
        info += trail.getFindStartText();
        $('#trailentrance').html(info);
        $("#trailinfotext").html(trail.getInfoText());
        $("#trailfacts").html("<p style=\"margin: 0; text-align:left;\">Lengde: " + Math.floor(trail.getLength() * 10000) / 10 + "m" +
                "<span style=\"float:right;\">" + (mobilecheck() ? "Høydefor." : "Høydeforskjell") + ": " + Math.floor(trail.getHeightDiff() * 10) / 10 + "m</span></p>" +
                "Vanskelighetsgrad: " + trail.getLevelAsText());
        $("#trailwindow").fadeIn(500, function() {
            trail.renderTo(this.trailMap);
            this.trailMap.fitBounds(trail.getBounds(), 6);
            /* graph container must be visible */
            if(this.show3d) {
                this.generateGraph3d(trail);
            } else {
                this.generateGraph2d(trail);
            }
        }.bind(this));
        // Instantiate our graph object.
    }
}