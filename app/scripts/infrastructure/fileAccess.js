"use strict";

module.exports = {
    FileAccess: class {
        constructor(importDir) {
            const fs = require('fs');
            const path = require('path');
            const mkdirp = require('mkdirp');

            this.importFile = function (src, importFileName, deleteSource, callback) {
                const dest = path.join(importDir, importFileName);

                fs.stat(importDir, function (err) {
                    if (!err) {
                        moveFile(src, dest, deleteSource, callback);
                        return;
                    }

                    if (err.code === 'ENOENT') {
                        console.log('creating: ' + importDir);

                        mkdirp(importDir, mkErr => {
                            if (mkErr)
                                callback(mkErr);
                            else
                                moveFile(src, dest, deleteSource, callback);
                        });
                    }
                    else {
                        console.error(err);
                        callback(err);
                    }
                });
            };

            this.deleteFile = function (fileName, callback) {
                const src = path.join(importDir, fileName);

                fs.unlink(src, err => {
                    callback(err);
                });
            };

            this.exportFile = function (fileName, dest, callback) {
                const src = path.join(importDir, fileName);

                moveFile(src, dest, false, callback);
            };

            function moveFile(src, dest, deleteSource, callback) {
                console.log('Moving file: ', { src, dest, deleteSource });

                // TODO:  Implement a promise?
                // TODO:  progress indicator?
                // TODO:  if same drive, use rename instead?

                fs.copyFile(src, dest, err => {
                    if (err) {
                        callback(err);
                    }
                    else if (deleteSource) {
                        fs.unlink(src, err => {
                            callback(err);
                        });
                    }
                    else {
                        callback();
                    }
                });
            }
        }
    }
};