"use strict";

module.exports = {
    VideosViewModel: class {
        constructor() {
            const self = this;
            const { ipcRenderer } = require('electron');

            self.videos = ko.observableArray();

            self.importVideo = function () {
                ipcRenderer.send('videos:import');
            };

            ipcRenderer.on('videos:import:submit', (event, item) => {
                self.videos.push(item);
                self.videos.sort((left, right) => {
                    return left.title === right.title
                        ? 0
                        : left.title < right.title ? -1 : 1;
                });
            });

            ipcRenderer.on('data:getVideos', (sender, data) => {
                const { err, category } = data;

                if (err) {
                    console.log(err);
                    swal({
                        title: 'Error',
                        text: 'An error has occurred!',
                        icon: 'warning'
                    });
                    return;
                }

                self.videos(category.videos);
            });

            ipcRenderer.send('data:getVideos', {});
        }
    }
};