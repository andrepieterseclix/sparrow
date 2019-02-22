"use strict";

function ensureDirectoryExists(directory, fs, mkdirp) {
    return new Promise((resolve, reject) => {
        fs.stat(directory, (err) => {
            if (!err) {
                resolve({ directory });
                return;
            }
            else if (err.code !== 'ENOENT') {
                reject(err);
                return;
            }

            mkdirp(directory, (err, made) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({ directory: made });
                }
            });
        });
    });
}

module.exports = {
    ensureDirectoryExists
};