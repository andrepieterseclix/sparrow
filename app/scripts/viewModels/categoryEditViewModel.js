"use strict";

module.exports = {
    CategoryEditViewModel: class {
        constructor(save) {
            const self = this;

            self.model = ko.observable({ name: 'test' });

            self.name = ko.observable();

            self.save = function () {
                const model = self.model();
                model.name = self.name();

                save(model);
            };

            self.cancel = function () {
                window.history.back();
            };
        }
    }
};