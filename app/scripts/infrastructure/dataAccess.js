"use strict";

/*
https://stackabuse.com/nedb-a-lightweight-javascript-database/
https://github.com/louischatriot/nedb

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
https://developers.google.com/web/fundamentals/primers/promises
https://javascript.info/promise-basics
https://scotch.io/tutorials/javascript-promises-for-dummies#toc-chaining-promises
*/
// TODO:  Encrypt data files

module.exports = {
    DataAccess: class {
        constructor(dataDirectory, encryptRecord, decryptRecord) {
            const Datastore = require('nedb');
            const unsortedCategoryName = 'Unsorted';
            const path = require('path');

            // Documents

            const categories = new Datastore({
                filename: path.join(dataDirectory, 'cats.db'),
                autoload: true,
                afterSerialization: encryptRecord,
                beforeDeserialization: decryptRecord
            });

            const videos = new Datastore({
                filename: path.join(dataDirectory, 'dogs.db'),
                autoload: true,
                afterSerialization: encryptRecord,
                beforeDeserialization: decryptRecord
            });

            // Constraints

            categories.ensureIndex({ fieldName: 'name', unique: true });
            videos.ensureIndex({ fieldName: 'title', unique: true });

            // Methods

            this.addCategory = function (category, callback) {
                categories.insert(category, (err, doc) => {
                    if (callback)
                        callback(err, doc);
                });
            };

            this.getCategories = function (callback) {
                categories.find({}).sort({ name: 1 }).exec((err, docs) => {
                    callback(docs);
                });
            };

            this.getVideos = function (categoryId, callback) {
                if (!categoryId) {
                    videos.find({}).sort({ title: 1 }).exec((err, videos) => {
                        callback(err, { videos });
                    });
                    return;
                }

                categories.findOne({ _id: categoryId }, (err, category) => {
                    if (err) {
                        callback(err);
                        return;
                    }

                    videos.find({ categories: { $elemMatch: category._id } }).sort({ title: 1 }).exec((err, videos) => {
                        if (err) {
                            callback(err);
                            return;
                        }

                        category.videos = videos;
                        callback(null, category);
                    });
                });
            };

            this.deleteCategory = function (category, callback) {
                const promise = unlinkCategoryFromVideos(category)
                    .then(getOrCreateUnsortedCategory)
                    .then(handleOrphanedVideos)
                    .catch(err => console.error(err))
                    .then(data => {
                        categories.remove({ _id: category._id }, (err) => {
                            callback(err, data);
                        });
                        return Promise.resolve();
                    })
                    .catch(err => {
                        console.error(err);
                        callback(err);
                    });
            };

            this.deleteVideo = function (video, callback) {
                videos.remove({ _id: video._id }, function (err, numDeleted) {
                    callback(err, numDeleted);
                });
            };

            this.addVideo = function (video, callback) {
                videos.insert(video, function (err, doc) {
                    if (callback)
                        callback(err, doc);
                });
            };

            this.getVideo = function (ids, callback) {
                videos.findOne({ _id: ids.videoId }, (err, video) => {
                    if (err) {
                        callback(err);
                    }
                    else if (!video) {
                        callback(new Error('Video not found!'));
                    }
                    else if (ids.categoryId && video.categories.includes(ids.categoryId)) {
                        categories.findOne({ _id: ids.categoryId }, (err, category) => {
                            if (err) {
                                console.error(err);
                                callback(null, { video });
                            }
                            else {
                                callback(null, { video, category });
                            }
                        });
                    }
                    else {
                        callback(null, { video });
                    }
                });
            };

            this.updateVideo = function (video, callback) {
                videos.update(
                    { _id: video._id },
                    video,
                    { multi: true, returnUpdatedDocs: true },
                    (err, numAffected, affectedDocuments) => {
                        callback(err, affectedDocuments);
                    }
                );
            };

            // Helper Methods

            function unlinkCategoryFromVideos(category) {
                return new Promise((resolve, reject) => {
                    videos.update(
                        { categories: { $elemMatch: category._id } }, // Select videos which contains the category id reference
                        { $pull: { categories: category._id } }, // Remove the category id reference
                        { multi: true, returnUpdatedDocs: true },
                        (err, numAffected, affectedDocuments) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                let orphanedVideos = numAffected > 0 && affectedDocuments && affectedDocuments.some(video => video.categories.length < 1);
                                console.log(`Unlinked category ${category._id} from videos`, { numAffected });

                                resolve({ orphanedVideos, category });
                            }
                        });
                });
            }

            function getOrCreateUnsortedCategory(data) {
                return new Promise(function (resolve, reject) {
                    const { orphanedVideos, category } = data;
                    if (!orphanedVideos) {
                        console.log(`No orphaned videos, no need to get '${unsortedCategoryName}' category reference.`);
                        resolve({});
                        return;
                    }

                    categories.findOne({ name: unsortedCategoryName }, (err, unsortedCategory) => {
                        let newUnsortedCategoryName = unsortedCategoryName;

                        if (err) {
                            reject(err);
                            return;
                        }

                        if (unsortedCategory) {
                            console.log(`Category ${unsortedCategoryName} already exists with Id ${unsortedCategory._id}`);

                            if (unsortedCategory._id === category._id) {
                                newUnsortedCategoryName = `${unsortedCategoryName}*`;
                            }
                            else {
                                resolve({ unsortedCategory });
                                return;
                            }
                        }

                        categories.insert({ name: newUnsortedCategoryName }, (err, unsortedCategory) => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            console.log(`Created category ${newUnsortedCategoryName} with Id ${unsortedCategory._id}.`);
                            resolve({ unsortedCategory });
                        });
                    });
                });
            }

            function handleOrphanedVideos(data) {
                return new Promise((resolve, reject) => {
                    const { unsortedCategory } = data;

                    if (!unsortedCategory) {
                        console.log('No orphaned videos to update.');
                        resolve({});
                        return;
                    }

                    videos.update(
                        { categories: { $size: 0 } },
                        { $push: { categories: unsortedCategory._id } },
                        { multi: true },
                        (err, numAffected) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                console.log(`Orphaned videos (${numAffected}) linked to category ${unsortedCategory._id}.`);
                                resolve({ unsortedCategory });
                            }
                        }
                    );
                });
            }
        }
    },
    Category: class {
        constructor(name) {
            this.name = name;
        }
    },
    Video: class {
        constructor(title, originalFileName, categories, skipSeconds) {
            this.title = title;
            this.originalFileName = originalFileName;
            this.categories = categories || [];

            // Optional
            if (skipSeconds) {
                this.skipSeconds = skipSeconds;
            }
        }
    }
};