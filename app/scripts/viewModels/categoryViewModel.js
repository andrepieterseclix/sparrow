"use strict";

module.exports = {
    CategoryViewModel: class {
        constructor() {
            const self = this;

            self.categoryId = ko.observable();

            self.categoryName = ko.observable();

            self.videos = ko.observableArray();
        }
    }
};