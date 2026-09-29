import { config } from "dotenv";
config({ quiet: true });

import app from "./app";

const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
    console.log(`🚀 Server listening at http://localhost:${port}`);
});

// Set server timeout for large file uploads
server.timeout = 600000; // 10 minutes
server.keepAliveTimeout = 610000; // Slightly longer than timeout
server.headersTimeout = 620000; // Slightly longer than keepAliveTimeout
