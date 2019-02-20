"use strict";

module.exports = {
    CategoriesViewModel: class {
        constructor(deleteCallback) {
            const self = this;

            self.categories = ko.observableArray();

            self.editMode = ko.observable(false);

            self.deleteCategory = function (category) {
                swal({
                    title: "Are you sure?",
                    text: `Delete category ${category.name}`,
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
                        if (willDelete && deleteCallback(category)) {
                            self.categories.remove(category);
                        }
                    });
            };
        }
    }
};