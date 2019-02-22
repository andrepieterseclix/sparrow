"use strict";

module.exports = {
    FileAccess: class {
        constructor(importDir) {
            const fs = require('fs');
            const path = require('path');
            const mkdirp = require('mkdirp');
            const ensureDirectoryExists = require('./directoryAccess').ensureDirectoryExists;

            this.importFile = function (src, importFileName, deleteSource) {
                const dest = path.join(importDir, importFileName);

                return ensureDirectoryExists(importDir, fs, mkdirp)
                    .then(dir => moveFile(src, dest, deleteSource));
            };

            this.deleteFile = function (fileName, callback) {
                const src = path.join(importDir, fileName);

                fs.unlink(src, err => {
                    callback(err);
                });
            };

            this.exportFile = function (fileName, dest) {
                const src = path.join(importDir, fileName);

                return moveFile(src, dest, false);
            };

            function moveFile(src, dest, deleteSource) {
                return new Promise((resolve, reject) => {
                    console.log('Moving file: ', { src, dest, deleteSource });

                    // TODO:  if same drive, use rename instead?

                    fs.copyFile(src, dest, err => {
                        if (err) {
                            reject(err);
                        }
                        else if (deleteSource) {
                            fs.unlink(src, err => {
                                if(err){
                                    console.log(err);
                                }
                                resolve({ src, dest, deleteSource, err });
                            });
                        }
                        else {
                            resolve({ src, dest, deleteSource });
                        }
                    });
                });
            }

            // function ensureDirectoryExists(directory) {
            //     return new Promise((resolve, reject) => {
            //         fs.stat(directory, (err) => {
            //             if (!err) {
            //                 resolve({ directory });
            //                 return;
            //             }
            //             else if (err.code !== 'ENOENT') {
            //                 reject(err);
            //                 return;
            //             }

            //             mkdirp(directory, (err, made) => {
            //                 if (err) {
            //                     reject(err);
            //                 }
            //                 else {
            //                     resolve({ directory: made });
            //                 }
            //             });
            //         });
            //     });
            // }
        }
    }
};