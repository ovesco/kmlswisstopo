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
                '</div>' +
            '</div>');

        $('#viewer-close').click(function() {
            OCA.KmlViewer.closeViewer();
        });

        $('#viewer-layout').click(function(event) {
            event.preventDefault();
            event.stopPropagation();
        });

        $('#viewer-container').click(function(event) {
            OCA.KmlViewer.closeViewer();
        });

        this.loadFile(file.dir, file.name, function(data) {

            let map = new ga.Map({
                target: 'kmlViewer',
                view: new ol.View({
                    resolution: 50,
                    center: [2660000, 1190000]
                })
            });

            map.addLayer(ga.layer.create('ch.astra.wanderland'));

            let vector = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: data,
                    format: new ol.format.KML({
                        projection: 'EPSG:21781'
                    })
                })
            });

            map.addLayer(vector);
        });
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
