"use strict";

module.exports = {
    VideoViewModel: class {
        constructor() {
            const self = this;
            const { FileAccess } = require('./../infrastructure/fileAccess');
            const { ipcRenderer } = require('electron');

            self.model = ko.observable();

            self.parentUrl = ko.observable();

            self.exportVideo = function () {
                ipcRenderer.send('videos:export', self.model());
            };

            self.deleteVideo = function () {
                swal({
                    title: "Are you sure?",
                    text: `Delete video '${self.model().title}'`,
                    icon: "warning",
                    buttons: {
                        confirm: {
                            text: "Yes",
                            value: true,
                            visible: true,
                            className: "btn-small red",
                            closeModal: true
                        },
                        cancel: {
                            text: "No",
                            value: null,
                            visible: true,
                            className: "btn-small grey lighten-2",
                            closeModal: true
                        }
                    }
                })
                    .then((willDelete) => {
                        if (willDelete) {

                            disposePlayer();
                            ipcRenderer.send('data:deleteVideo', self.model());
                        }
                    });
            };

            ipcRenderer.on('videos:export', (event, info) => {
                const { fileName, exportPath, importDir } = info;
                const fileAccess = new FileAccess(importDir);

                if (exportPath) {
                    fileAccess.exportFile(fileName, exportPath, err => {
                        if (err) {
                            console.log(err);
                            swal({
                                title: 'Error',
                                text: 'An error has occurred!',
                                icon: 'warning'
                            });
                        }
                        else {
                            swal({
                                title: 'Success',
                                text: 'The file has been exported!',
                                icon: 'info'
                            });
                        }
                    });
                }
            });

            ipcRenderer.on('data:deleteVideo', (event, response) => {
                const { err, importDir } = response;

                if (err) {
                    console.log(err);
                    swal({
                        title: 'Error',
                        text: 'An error has occurred!',
                        icon: 'warning'
                    });
                    return;
                }

                const fileAccess = new FileAccess(importDir);

                fileAccess.deleteFile(self.model()._id, err => {
                    if (err) {
                        console.log(err);
                        swal({
                            title: 'Error',
                            text: 'An error has occurred!',
                            icon: 'warning'
                        });
                    }
                    else {
                        document.location = self.parentUrl();
                    }
                });
            });
        }
    }
};