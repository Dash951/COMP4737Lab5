// DISCLOSURE: AI was used to aid in the development of this code

const http = require("http");
const mysql = require("mysql2/promise");
const messages = require("./lang/messages/en/user.json");

const CREATE_TABLE_QUERY = `
  CREATE TABLE IF NOT EXISTS patient (
    patientid INT(11) AUTO_INCREMENT,
    name VARCHAR(100),
    dateOfBirth DATETIME,
    PRIMARY KEY (patientid)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`;

/**
 * Database class for everything that touches MySQL
 */
class Database {
    constructor() {
        this.writer = this.makePool(process.env.WRITER_USER, process.env.WRITER_PASS);
        this.reader = this.makePool(process.env.READER_USER, process.env.READER_PASS);
    }

    /**
     * Builds a pool. Only the user and password change between the writer and reader 
     */
    makePool(user, password) {
        return mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: user,
            password: password,
        });
    }

    /**
     * Runs one query on the given pool and returns the result.
     */
    async run(pool, sql, values) {
        const [result] = await pool.query(sql, values);
        return result;
    }

    /**
     * Creates the patient table if it does not exist
     */
    createTable() {
        return this.run(this.writer, CREATE_TABLE_QUERY);
    }

    /**
     * Inserts the patients and returns the amount of rows added 
     */
    async insertQuery(patients) {
        await this.createTable();
        const rows = patients.map((p) => [p.name, p.dateOfBirth]);
        const result = await this.run(
            this.writer,
            "INSERT INTO patient (name, dateOfBirth) VALUES ?",
            [rows]
        );
        return result.affectedRows;
    }

    /**
     * The reader can only SELECT, so MySQL refuses DROP, UPDATE, DELETE.
     */
    selectQuery(sql) {
        return this.run(this.reader, sql);
    }
}

/**
 * Server class that receives the HTTP requests, decides what to do, calls the database, and sends the response.
 */
class Server {
    constructor(port) {
        this.port = port;
        this.endpoint = "/lab5/api/v1/sql"; //URL endpoint 
        this.db = new Database();
        this.server = http.createServer(this.handleRequest.bind(this));
    }

    /**
     * Creates the table when the server starts, and then listens for requests.
     */
    start() {
        this.db.createTable().catch((err) => console.error(messages.createTableErrorMessage, err.message));
        this.server.listen(this.port, () => console.log(`${messages.serverStartMessage} ${this.port}`));
    }

    /**
     * Sends a JSON response with the given status, message, and any extra data.
     */
    send(res, status, message, extra = {}) {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status, message, ...extra }));
    }

    /**
     * Handles the HTTP request, including CORS headers, OPTIONS preflight, and routing to GET or POST handlers.
     */
    async handleRequest(req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // * Change to server one url
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        // The browser sends OPTIONS before a POST with JSON.
        if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
        }

        // Ensures it works even if the server is has additional folders in the url 
        const path = new URL(req.url, "http://localhost").pathname;
        const index = path.indexOf(this.endpoint);
        if (index === -1) {
            this.send(res, 404, messages.invalidEndpointMessage);
        } else if (req.method === "GET") {
            await this.handleGet(res, path.substring(index + this.endpoint.length + 1));
        } else if (req.method === "POST") {
            this.handlePost(req, res);
        } else {
            this.send(res, 405, messages.methodNotAllowedMessage);
        }
    }

    /**
     * Runs when the user submites and puts the SQL the user typed at the end of the web address. Decodes the query, runs it, and sends it back to the page 
     */
    async handleGet(res, encoded) {
        try {
            // Undo encodeURIComponent and remove the quotes around the query.
            const query = decodeURIComponent(encoded).trim().replace(/^"|"$/g, "");
            const rows = await this.db.selectQuery(query);
            this.send(res, 200, messages.selectSuccessMessage, { data: rows });
        } catch (err) {
            this.sendDbError(res, err, messages.selectFailureMessage);
        }
    }

    /**
     * Runs when the user submits the form with the patients. It reads the body, parses it, and inserts it into the database.
     */
    handlePost(req, res) {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
            let patients;
            try {
                patients = JSON.parse(body);
            } catch (err) {
                this.send(res, 400, messages.invalidJsonMessage);
                return;
            }

            if (!this.isValid(patients)) {
                this.send(res, 400, messages.invalidPatientsMessage);
                return;
            }

            try {
                const inserted = await this.db.insertQuery(patients);
                this.send(res, 200, messages.insertSuccessMessage, { inserted });
            } catch (err) {
                this.sendDbError(res, err, messages.insertFailureMessage);
            }
        });
    }

    /**
     * Checks if the patients array is valid: it must be a non-empty array of objects with string name and dateOfBirth.
     */
    isValid(patients) {
        return (
            Array.isArray(patients) &&
            patients.length > 0 &&
            patients.every((p) => p && typeof p.name === "string" && typeof p.dateOfBirth === "string")
        );
    }

    /**
     * Turns the database error into an HTTP response with status codes and messages 
     */
    sendDbError(res, err, defaultMessage) {
        if (err.code && err.code.includes("DENIED")) {
            this.send(res, 403, messages.forbiddenQueryMessage, { error: err.sqlMessage });
        } else if (err.sqlMessage) {
            this.send(res, 400, defaultMessage, { error: err.sqlMessage });
        } else {
            console.error(err);
            this.send(res, 500, defaultMessage);
        }
    }
}

new Server(process.env.PORT || 8080).start();