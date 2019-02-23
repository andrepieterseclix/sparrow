"use strict";

module.exports = {
    VideoViewModel: class {
        constructor() {
            const self = this;
            const { FileAccess } = require('./../infrastructure/fileAccess');
            const { ipcRenderer, remote } = require('electron');
            let editWindow;

            self.model = ko.observable();

            self.parentUrl = ko.observable();

            self.exportVideo = function () {
                swal({
                    title: "Confirm",
                    text: 'Do you want to export a metadata file for this video?',
                    icon: "warning",
                    buttons: {
                        yes: {
                            text: "Yes",
                            value: true,
                            visible: true,
                            className: "btn-small blue",
                            closeModal: true
                        },
                        no: {
                            text: "No",
                            value: false,
                            visible: true,
                            className: "btn-small red lighten-1",
                            closeModal: true
                        },
                        cancel: {
                            text: "Cancel",
                            value: null,
                            visible: true,
                            className: "btn-small grey lighten-2",
                            closeModal: true
                        }
                    }
                })
                    .then(value => {
                        if (value !== null) {
                            console.log('wtf');
                            ipcRenderer.send('videos:export', { video: self.model(), exportMeta: value });
                        }
                    });
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

            self.editVideo = function () {
                //ipcRenderer.send('video:edit', self.model());
                editWindow = new remote.BrowserWindow({
                    parent: remote.getCurrentWindow(),
                    modal: true,
                    show: false
                });

                editWindow.once('ready-to-show', () => {
                    editWindow.show();
                });

                editWindow.on('closed', () => {
                    editWindow = null;
                });

                editWindow.loadFile('./app/video_edit.html');
            };

            ipcRenderer.on('videos:export', (event, info) => {
                const { fileName, exportPath, importDir, item } = info;
                const fileAccess = new FileAccess(importDir);

                if (!exportPath) {
                    return;
                }

                // TODO:  progress indicator?
                fileAccess.exportFile(fileName, exportPath)
                    .then(x => exportMetadata(x.dest, item.video, item.exportMeta, fileAccess))
                    .then(() => {
                        swal({
                            title: 'Success',
                            text: 'The file has been exported!',
                            icon: 'info'
                            //buttons: false
                        });
                    })
                    .catch(err => {
                        console.log(err);
                        swal({
                            title: 'Error',
                            text: 'An error has occurred!',
                            icon: 'warning'
                        });
                    });
            });

            function exportMetadata(exportFileName, video, exportMeta, fileAccess) {
                if (!exportMeta) {
                    return Promise.resolve();
                }

                const model = { ...video };
                delete model._id;

                return fileAccess.writeMetaFile(exportFileName, model, true);
            }

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

            ipcRenderer.on('video:edit', (event, result) => {
                // TODO

            });
        }
    }
};