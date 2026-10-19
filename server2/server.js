const http = require("http");
const mysql = require("mysql2/promise");

class Config {
    constructor(env) {
        this.port = Number(env.PORT) || 3000;
        this.dbConfig = {
    }
}