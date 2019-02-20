"use strict";

module.exports = {
    VideoStreamingServer: class {
        constructor(importDir) {
            const http = require('http');
            const fs = require('fs');
            const hostname = '127.0.0.1';
            const port = 3000;

            const server = http.createServer((request, response) => {
                if (!request.url.startsWith('/video/')) {
                    response.statusCode = 404;
                    response.end();
                }

                const fileName = request.url.substr(7, 16);
                const path = `${importDir}\\${fileName}`;
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

            this.start = function () {
                server.listen(port, hostname, () => {
                    console.log(`Streaming Server started on port ${port}`);
                });
            };
        }
    }
};