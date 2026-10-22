// DISCLOSURE: AI was used to aid in the development of this code

const http = require("http");
const fs = require("fs");
const path = require("path");

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8"
};

/**
 * Serves the client files in this folder.
 */
class StaticServer {
    constructor(port, root) {
        this.port = port;
        this.root = root;
        this.server = http.createServer(this.handleRequest.bind(this));
    }

    /**
     * Starts listening for page requests.
     */
    start() {
        this.server.listen(this.port, () => console.log(`Server on port ${this.port}`));
    }

    /**
     * Sends the requested file, or index.html for a folder address.
     */
    handleRequest(req, res) {
        const url = new URL(req.url, "http://localhost");
        let pathname = decodeURIComponent(url.pathname);
        if (pathname.endsWith("/")) {
            pathname += "index.html";
        }

        const filePath = path.normalize(path.join(this.root, pathname));
        if (filePath !== this.root && !filePath.startsWith(this.root + path.sep)) {
            res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Forbidden");
            return;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
                res.end("Not found");
                return;
            }
            const type = MIME_TYPES[path.extname(filePath)] || "application/octet-stream";
            res.writeHead(200, { "Content-Type": type });
            res.end(data);
        });
    }
}

new StaticServer(process.env.PORT || 3005, __dirname).start();
