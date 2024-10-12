/*
 ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██████╔╝███████╗
██║     ██║   ██║██╔══██╗╚════██║
╚██████╗╚██████╔╝██║  ██║███████║
 ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
*/

import cors from 'cors';

// CORS middleware configuration
const corsConfig = cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
});

export default corsConfig;
