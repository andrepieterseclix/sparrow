"use strict";

module.exports = {
    SecurityViewModel: class {
        constructor() {
            const self = this;
            const { ipcRenderer } = require('electron');
            const confirmPassword = document.querySelector('#confirmPassword');
            const password = document.querySelector('#password');

            // Event handlers
            password.oninput = confirmPassword.oninput = () => {
                confirmPassword.setCustomValidity("");
            };

            // Methods
            self.password = ko.observable();
            self.confirmPassword = ko.observable();

            self.submit = function () {
                const pw = self.password();
                const conf = self.confirmPassword();

                if (!pw) {
                    confirmNoPassword()
                        .then((positive) => {
                            if (positive) {
                                ipcRenderer.send('passwordSet', {});
                            }
                        });
                }
                else {
                    if (pw !== conf) {
                        confirmPassword.setCustomValidity("Passwords Don't Match");
                    }
                    else {
                        ipcRenderer.send('passwordSet', { pw });
                    }
                }
            };

            self.cancel = function () {
                ipcRenderer.send('quit');
            };

            function confirmNoPassword() {
                return swal({
                    title: "Are you sure?",
                    text: 'Continue without data encryption.',
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
                });
            }
        }
    }
};