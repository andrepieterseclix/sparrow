"use strict";

module.exports = {
    CategoryViewModel: class {
        constructor(importVideo) {
            const self = this;

            self.pageNumber = ko.observable();

            self.pageSize = ko.observable();

            self.categoryId = ko.observable();

            self.categoryName = ko.observable();

            self.videos = ko.observableArray();

            self.importVideo = importVideo;
        }
    }
};