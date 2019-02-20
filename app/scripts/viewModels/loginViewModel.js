"use strict";

module.exports = {
    LoginViewModel: class {
        constructor() {
            const self = this;
            const { ipcRenderer } = require('electron');

            self.password = ko.observable();

            self.message = ko.observable();

            self.login = function () {
                ipcRenderer.send('passwordEntered', { pw: self.password() });
            };

            self.cancel = function () {
                ipcRenderer.send('quit');
            };

            ipcRenderer.on('passwordEntered:incorrect', () => {
                self.message('Incorrect password!');
                self.password('');
            });
        }
    }
};