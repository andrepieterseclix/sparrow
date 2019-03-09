// JavaScript source code
"use strict";

module.exports = {
    SecurityHandler: class {
        constructor(dataDirectory) {
            const self = this;
            const fs = require('fs');
            const path = require('path');
            const mkdirp = require('mkdirp');
            const winattr = require('winattr');
            const { ensureDirectoryExists } = require('./directoryAccess');
            const securityFilePath = path.join(dataDirectory, 'security.db');
            const phrase = "[this is a secret]";
            const crypto = require('crypto');
            let securityFile = 0;
            let securityFileContents = null;

            const ALGORITHM = 'aes-256-cbc';
            const BLOCK_SIZE = 16;
            const KEY_SIZE = 32;

            // Methods
            self.checkSecurity = function () {
                return ensureDirectoryExists(dataDirectory, fs, mkdirp)
                    .then(hideDataFolder)
                    .then(openFile)
                    .then(readSecurity)
                    .then(closeFile)
                    .then(createEncryptionHooks);
            };

            self.checkPassword = function (pw) {
                return calculateKey(pw)
                    .then(key => decrypt(securityFileContents, key))
                    .catch(err => console.error(err))
                    .then(comparePassword)
                    .then(createEncryptionHooks);
            };

            self.setPassword = function (pw) {
                let promise = Promise.resolve(pw);

                if (!pw) {
                    promise = promise
                        .then(() => saveSecret({ ciphertext: phrase, key: '' }));
                }
                else {
                    promise = promise
                        .then(calculateKey)
                        .then(key => encrypt(phrase, key))
                        .then(saveSecret);
                }

                return promise
                    .then(closeFile)
                    .then(createEncryptionHooks);
            };

            function createEncryptionHooks(result) {
                result = result || {};

                if (!result.key) {
                    result.encryptRecord = doc => doc;
                    result.decryptRecord = doc => doc;
                }
                else {
                    result.encryptRecord = function (doc) {
                        const encryptedData = encryptData(doc, result.key);
                        return encryptedData.ciphertext;
                    };
                    result.decryptRecord = function (doc) {
                        const decryptedData = decryptData(doc, result.key);
                        return decryptedData.plaintext;
                    }
                }

                return Promise.resolve(result);
            }

            function comparePassword(result) {
                result = result || {};

                return Promise.resolve({
                    isValid: result.plaintext === phrase,
                    key: result.key
                });
            }

            function hideDataFolder(data) {
                return new Promise(resolve => {
                    try {
                        const hiddenFolder = path.dirname(data.directory);
                        winattr.set(hiddenFolder, { hidden: true, system: true }, err => {
                            if (err) {
                                console.error(err);
                            }
                        });
                    } catch (error) {
                        console.error(error);
                    }
                    resolve();
                });
            }

            function openFile() {
                return new Promise((resolve, reject) => {
                    fs.open(securityFilePath, 'as+', (err, fd) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        securityFile = fd;
                        resolve(fd);
                    });
                });
            }

            function closeFile(data) {
                return new Promise((resolve, reject) => {
                    if (!securityFile || data.requiresInput) {
                        resolve(data);
                        return;
                    }

                    fs.close(securityFile, err => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            securityFile = 0;
                            resolve(data);
                        }
                    });
                });
            }

            function readSecurity(fd) {
                return new Promise((resolve, reject) => {
                    fs.readFile(fd, { encoding: 'utf8' }, (err, contents) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        securityFileContents = contents;

                        const data = {
                            fd,
                            requiresInput: !contents,
                            isEncrypted: contents !== '' && contents !== phrase
                        };

                        resolve(data);
                    });
                });
            }

            function calculateKey(pw) {
                return new Promise((resolve, reject) => {
                    crypto.scrypt(pw, 'salt', KEY_SIZE, (err, derivedKey) => {
                        if (err)
                            reject(err);
                        else
                            resolve(derivedKey);
                    });
                });
            }

            function saveSecret(data) {
                return new Promise((resolve, reject) => {
                    fs.write(securityFile, data.ciphertext, (err, written, buffer) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(data);
                        }
                    });
                });
            }

            function encryptData(plaintext, key) {
                // Generate random IV.
                const iv = crypto.randomBytes(BLOCK_SIZE);

                // Encrypt
                const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
                const ciphertext = Buffer.concat([iv, cipher.update(plaintext), cipher.final()]);

                // Encode result
                return { ciphertext: ciphertext.toString('base64') };
            }

            function decryptData(ciphertext, key) {
                const ciphertextBytes = Buffer.from(ciphertext, 'base64');

                // Get IV from initial bytes.
                const iv = ciphertextBytes.slice(0, BLOCK_SIZE);

                // Get encrypted data from remaining bytes.
                const data = ciphertextBytes.slice(BLOCK_SIZE);

                // Create decipher from key and IV.
                const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

                // Decrypt data.
                const plaintextBytes = Buffer.concat([decipher.update(data), decipher.final()]);
                const plaintext = plaintextBytes.toString();

                return { plaintext };
            }

            function encrypt(plaintext, key) {
                return new Promise((resolve, reject) => {
                    try {
                        const result = encryptData(plaintext, key);
                        result.key = key;
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });
            }

            function decrypt(ciphertext, key) {
                return new Promise((resolve, reject) => {
                    try {
                        const result = decryptData(ciphertext, key);
                        result.key = key;
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        }
    }
};