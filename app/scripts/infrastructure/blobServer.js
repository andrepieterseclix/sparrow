"use strict";

class BlobServer {
    constructor(importDir) {
        //const http = require('http');
        const express = require('express');
        const app = express();
        const fs = require('fs');
        const path = require('path');
        const hostname = '127.0.0.1';
        const port = 3000;

        app.get('/image/:id', (request, response) => {
            const path = getFileName(request);
            const stat = fs.statSync(path);
            const fileSize = stat.size;
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'image/png'
            };

            response.writeHead(200, head);
            const file = fs.createReadStream(path);
            // TODO:  encrypt/decrypt
            // read contents
            // decrypt
            // pipe to response

            response.on('finish', () => closeFile(file));
            response.on('close', () => closeFile(file));

            file.pipe(response);
        });

        app.get('/video/:id', (request, response) => {
            const path = getFileName(request);
            const stat = fs.statSync(path);
            const fileSize = stat.size;
            const range = request.headers.range;

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunkSize = end - start + 1;
                const file = fs.createReadStream(path, { start, end });
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunkSize,
                    'Content-Type': 'video/mp4'
                };

                response.on('finish', () => closeFile(file));
                response.on('close', () => closeFile(file));
                response.writeHead(206, head);
                file.pipe(response);
            }
            else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4'
                };

                response.writeHead(200, head);
                const file = fs.createReadStream(path);
                response.on('finish', () => closeFile(file));
                response.on('close', () => closeFile(file));

                file.pipe(response);
            }
        });

        function closeFile(file) {
            try {
                file.close();
            }
            catch (e) {
                console.error(e);
            }
        }

        function getFileName(request) {
            const fileName = request.params.id;
            return path.join(importDir, fileName);
        }

        this.start = function () {
            app.listen(port, hostname, () => {
                console.log(`Blob Server started on port ${port}`);
            });
        };
    }
}

module.exports = {
    BlobServer
};