"use strict";

module.exports = {
    VideoImportViewModel: class {
        constructor() {
            const self = this;
            const path = require("path");
            const { ipcRenderer } = require('electron');
            const { FileAccess } = require('./../infrastructure/fileAccess');
            const { Video } = require('./../infrastructure/dataAccess');
            const cancelButton = document.querySelector('#cancelButton');

            self.title = ko.observable();
            self.filePath = ko.observable();
            self.deleteSourceFile = ko.observable(true);
            self.categories = ko.observableArray();
            self.busy = ko.observable(false);

            self.chooseFile = function () {
                ipcRenderer.send('videos:import:selectFile');
            };

            self.submitVideoImport = function () {
                self.busy(true);

                const deleteSourceFile = self.deleteSourceFile();

                const categories = self
                    .categories()
                    .filter(x => x.selected())
                    .map(x => x._id);

                const video = new Video(
                    self.title(),
                    path.basename(self.filePath()),
                    categories);

                ipcRenderer.send('data:createVideo', { video, deleteSourceFile });
            };

            cancelButton.addEventListener('click', event => {
                event.preventDefault();
                ipcRenderer.send('videos:import:submit');
            });

            ipcRenderer.on('videos:import:selectFile', (event, data) => {
                if (data)
                    self.filePath(data[0]);
            });

            ipcRenderer.on('data:createVideo', (event, data) => {
                const { video, error, deleteSourceFile, importDir } = data;
                const fileAccess = new FileAccess(importDir);

                if (error) {
                    handleError(error);
                    return;
                }

                let importError = null;

                beginProgress()
                    .then(() => fileAccess.importFile(self.filePath(), video._id, deleteSourceFile))
                    .catch(err => importError = handleError(err, video))
                    .then(endProgress)
                    .then(() => {
                        if (!importError)
                            ipcRenderer.send('videos:import:submit', video);
                    });
            });

            ipcRenderer.send('data:getCategories');

            ipcRenderer.on('data:getCategories', (event, data) => {
                data.forEach(category => {
                    category.selected = ko.observable(false);
                    self.categories.push(category);
                });
            });

            function handleError(err, video) {
                if (video)
                    ipcRenderer.send('data:deleteVideo', video);

                self.busy(false);
                console.error(err);
                swal({
                    title: 'Error',
                    text: 'An error has occurred!',
                    icon: 'warning'
                });

                return err;
            }

            function beginProgress() {
                // TODO: put in separate module for reusability?
                // TODO:  indicate progress on UI
                self.busy(true);

                return Promise.resolve();
            }

            function endProgress() {
                // TODO:  indicate progress on UI
                self.busy(false);

                return Promise.resolve();
            }
        }
    }
};