"use strict";

module.exports = {
    IndexViewModel: class {
        constructor() {
            const self = this;

            self.videos = ko.observableArray();

            self.categories = ko.observableArray();

            self.featuredVideos = ko.observableArray();

            self.setVideos = function (videos) {
                videos.forEach(video => {
                    let skipSeconds = '';
                    if (video.skipSeconds) {
                        skipSeconds = `#t=${video.skipSeconds}`;
                    }
                    video.url = `http://localhost:3000/video/${video._id}${skipSeconds}`;
                });

                self.featuredVideos.push(videos.pop());
                self.videos(videos);
            }
        }
    }
}