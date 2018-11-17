const KmlViewer = {

    viewerId: 'kmlViewer',

    map: null,

    $main: null,

    _onViewerTrigger: function(filename, context) {
        this.loadViewer({
            name: filename,
            dir: context.dir
        });

        history.pushState({file: filename, dir: context.dir}, 'Editor', '#kmlviewer-main');
    },

    getSupportedMimetypes() {
        return [
            'application/vnd.google-earth.kml+xml',
            'application/kml'
        ]
    },

    registerFileActions: function() {
        const $this = this;
        $.each(this.getSupportedMimetypes(), function(k, mime) {
            OCA.Files.fileActions.registerAction({
                name: 'Voir le tracé',
                mime: mime,
                actionHandler: _.bind($this._onViewerTrigger, $this),
                permissions: OC.PERMISSION_READ,
                icon: function() {
                    return OC.imagePath('core', 'actions/fullscreen');
                }
            });

            OCA.Files.fileActions.setDefault(mime, 'edit');
        });
    },

    loadFile: function(dir, filename, success, failure) {
        $.get(OC.generateUrl('/apps/kmlswisstopo/ajax/loadfile'), {
            filename: filename,
            dir: dir
        }).done(function(data) {
            success(data.filecontents);
        }).fail(function(xhr) {
            failure(JSON.parse(xhr.responseText).message);
        });
    },

    loadViewer: function(file) {
        const $this = this;
        this.$main.html('<div id="viewer-overlay"></div>' +
            '<div id="viewer-container">' +
                '<div id="viewer-layout">' +
                    '<div id="viewer-toolbar">' +
                        '<div><span>' + file.name + '</span></div>' +
                        '<button id="viewer-close">Fermer</button>' +
                    '</div>' +
                    '<div id="viewer-wrap">' +
                        '<div id="viewer-preview-wrap">' +
                            '<div id="' + this.viewerId + '"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div id="viewer-profile">' +
                        '<canvas id="profile-canvas"></canvas>' +
                    '</div>' +
                '</div>' +
            '</div>');

        $('#viewer-close').click(function() {
            OCA.KmlViewer.closeViewer();
        });

        $('#viewer-layout').click(function(event) {
            event.preventDefault();
            event.stopPropagation();
        });

        $('#viewer-container').click(function() {
            OCA.KmlViewer.closeViewer();
        });

        let shownPoint = null;
        let map = new ga.Map({
            target: 'kmlViewer',
            view: new ol.View({
                resolution: 200,
                center: [2660000, 1190000]
            })
        });

        map.addLayer(ga.layer.create('ch.swisstopo.pixelkarte-farbe'));

        let vector = new ol.layer.Vector({
            source: new ol.source.Vector({
                url: OC.generateUrl('/apps/kmlswisstopo/ajax/loadfile') + "?filename=" + file.name + "&dir=" + file.dir,
                format: new ol.format.KML({
                    projection: 'EPSG:21781'
                })
            })
        });

        map.addLayer(vector);

        map.on('singleclick', function(evt) {
            $this.hideProfile();
            if(shownPoint)
                map.removeLayer(shownPoint);

            let pixel = evt.pixel;
            let feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                return feature;
            });

            if(feature && feature.getGeometry().getType() === "LineString") {
                let format = new ol.format.GeoJSON();
                let dump = JSON.parse(format.writeFeature(feature));

                $.get('https://api3.geo.admin.ch/rest/services/profile.json', {
                    geom: JSON.stringify(dump.geometry),
                    nb_points: 100
                }).done(function(data) {
                    if(data.length > 0) {
                        $this.showProfile(data, function(hoverItem) {

                            if(shownPoint)
                                map.removeLayer(shownPoint);

                            shownPoint = new ol.layer.Vector({
                                source: new ol.source.Vector({
                                    features: [new ol.Feature({
                                        geometry: new ol.geom.Point([hoverItem.easting, hoverItem.northing])
                                    })]
                                }),
                                style: new ol.style.Style({
                                    image: new ol.style.Icon({
                                        anchor: [0.5, 0.5],
                                        anchorXUnits: 'fraction',
                                        anchorYUnits: 'fraction',
                                        src: ' data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABmJLR0QADgAQAG+HWNqnAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH4gsQDCMe/S3FwQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAC+SURBVBjTjZAxCsJAFERfYqHVsiAewVI7wQuIZ9BabLfQyjOokDZY6xnUwk7YtcumMpcIaZJgEZsNBLXwlfOH4c94OIRUM2AJjJz0AMIsDU4AnjNtgRW/2WVpsPZc0hHgel4wGPYBsFHCZHqozXOEVDchVaW1rT7R2lZCqkpIdfPrn+qkJg1t5PMnvmuHjZKvY0N7+EAIMJkeMCYmL0ryosSYuFkm/HueFkBZ6Eu7M34CXaAHvIA7sMnSYA/wBi2vVHv+E2k7AAAAAElFTkSuQmCC'
                                    })
                                })
                            });

                            map.addLayer(shownPoint);
                        });
                    }
                }).error(function(fail) {
                    console.log(fail);
                });
            }
        });
    },

    showProfile(data, cb) {
        let $this = this;
        let container = document.getElementById('viewer-profile');
        container.chart = new Chart(document.getElementById('profile-canvas'), {
            type: 'line',
            options: {
                maintainAspectRatio: false,
                legend: {
                    display: false,
                },
                tooltips: {
                    callbacks: {
                        title: function(itemArray, data) {
                            let index = itemArray[0].index;
                            let dataSetIndex = itemArray[0].datasetIndex;
                            let item = data.datasets[dataSetIndex].data[index];
                            cb(item);
                            return null;
                        },

                        label: function(itemArray, data) {
                            let index = itemArray.index;
                            let dataSetIndex = itemArray.datasetIndex;
                            let item = data.datasets[dataSetIndex].data[index];
                            console.log(item);
                            return "Distance du début: " + item.dist + " - Altitude: " + item.y + " - Coordonnées: " +
                                $this.toCoordinate(item.easting) + ", " + $this.toCoordinate(item.northing);
                        }
                    }
                }
            },
            data: {
                labels: data.map(function(item) {
                    return Math.round(item.dist);
                }),
                datasets: [{
                    data: data.map(item => {
                        item.y = Math.round(item.alts.DTM25);
                        return item;
                    }),
                    fillColor: 'red',
                    strokeColor: '#863642'
                }]
            }
        });
        container.style.display = 'block';
    },

    toCoordinate(coord) {
        let crd = `${Math.round(coord)}`;
        return crd[0] + "'" + crd[1] + crd[2] + crd[3] + "'" + crd[4] + crd[5] + crd[6];
    },

    hideProfile() {
        let container = document.getElementById('viewer-profile');
        if(container.chart)
            container.chart.destroy();
        container.chart = null;
        container.style.display = 'none';
    },

    closeViewer: function() {
        this.$main.html('');
    }
};

OCA.KmlViewer = KmlViewer;

$(document).ready(function() {
    if($('#content.app-files').length) {
        OCA.KmlViewer.registerFileActions();
        $('#content').append('<div id="kmlviewer-main"></div>');
        OCA.KmlViewer.$main = $('#kmlviewer-main');
    }
});
