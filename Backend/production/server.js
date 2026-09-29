"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ quiet: true });
const app_1 = __importDefault(require("./app"));
const port = process.env.PORT || 4000;
const server = app_1.default.listen(port, () => {
    console.log(`🚀 Server listening at http://localhost:${port}`);
});
// Set server timeout for large file uploads
server.timeout = 600000; // 10 minutes
server.keepAliveTimeout = 610000; // Slightly longer than timeout
server.headersTimeout = 620000; // Slightly longer than keepAliveTimeout
