/*
███╗   ███╗ ██████╗ ██╗   ██╗██╗███████╗███████╗     █████╗ ███╗   ██╗██╗███╗   ███╗███████╗     █████╗ ██████╗ ██╗
████╗ ████║██╔═══██╗██║   ██║██║██╔════╝██╔════╝    ██╔══██╗████╗  ██║██║████╗ ████║██╔════╝    ██╔══██╗██╔══██╗██║
██╔████╔██║██║   ██║██║   ██║██║█████╗  ███████╗    ███████║██╔██╗ ██║██║██╔████╔██║█████╗      ███████║██████╔╝██║
██║╚██╔╝██║██║   ██║╚██╗ ██╔╝██║██╔══╝  ╚════██║    ██╔══██║██║╚██╗██║██║██║╚██╔╝██║██╔══╝      ██╔══██║██╔═══╝ ██║
██║ ╚═╝ ██║╚██████╔╝ ╚████╔╝ ██║███████╗███████║    ██║  ██║██║ ╚████║██║██║ ╚═╝ ██║███████╗    ██║  ██║██║     ██║
╚═╝     ╚═╝ ╚═════╝   ╚═══╝  ╚═╝╚══════╝╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝     ╚═╝
*/

/*
===========================
--------- IMPORTS ---------
===========================
*/
import express from "express";
import path from "path";
import { PORT } from './config/constants.js';
import { __dirname } from './utils/pathHelper.js';
import logger from './utils/logger.js';
import corsConfig from './config/corsConfig.js';
import securityHeaders from './config/securityHeaders.js';
import movieRoutes from './routes/movies.js';
import tvShowRoutes from './routes/tvShows.js';
import animeRoutes from './routes/anime.js';
import { tmdbLimiter, jikanLimiter, jikanMinuteLimiter } from './middlewares/rateLimiter.js';

const app = express();

/*
███╗   ███╗██╗██████╗ ██████╗ ██╗     ███████╗██╗    ██╗ █████╗ ██████╗ ███████╗
████╗ ████║██║██╔══██╗██╔══██╗██║     ██╔════╝██║    ██║██╔══██╗██╔══██╗██╔════╝
██╔████╔██║██║██║  ██║██║  ██║██║     █████╗  ██║ █╗ ██║███████║██████╔╝█████╗  
██║╚██╔╝██║██║██║  ██║██║  ██║██║     ██╔══╝  ██║███╗██║██╔══██║██╔══██╗██╔══╝  
██║ ╚═╝ ██║██║██████╔╝██████╔╝███████╗███████╗╚███╔███╔╝██║  ██║██║  ██║███████╗
╚═╝     ╚═╝╚═╝╚═════╝ ╚═════╝ ╚══════╝╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
*/
app.use(express.json());
// Setting headers to avoid CSP errors
app.use(securityHeaders);
// CORS middleware
app.use(corsConfig);
// Middleware to serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// middleware to log incoming requests
app.use((request, response, next) => {
    logger.info(`[${new Date().toISOString()}] ${request.method} ${request.url} - IP: ${request.ip}`);
    next();
});

const publicDirectoryPath = path.resolve(process.cwd(), 'public');
app.use(express.static(publicDirectoryPath));

/*
██████╗ ███████╗███████╗ █████╗ ██╗   ██╗██╗  ████████╗
██╔══██╗██╔════╝██╔════╝██╔══██╗██║   ██║██║  ╚══██╔══╝
██║  ██║█████╗  █████╗  ███████║██║   ██║██║     ██║   
██║  ██║██╔══╝  ██╔══╝  ██╔══██║██║   ██║██║     ██║   
██████╔╝███████╗██║     ██║  ██║╚██████╔╝███████╗██║   
╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   
*/
app.get("/", (request, response) => {
    response.sendFile(path.join(publicDirectoryPath, "index.html"));
});

/*
███████╗███╗   ██╗██████╗ ██████╗  ██████╗ ██╗███╗   ██╗████████╗███████╗
██╔════╝████╗  ██║██╔══██╗██╔══██╗██╔═══██╗██║████╗  ██║╚══██╔══╝██╔════╝
█████╗  ██╔██╗ ██║██║  ██║██████╔╝██║   ██║██║██╔██╗ ██║   ██║   ███████╗
██╔══╝  ██║╚██╗██║██║  ██║██╔═══╝ ██║   ██║██║██║╚██╗██║   ██║   ╚════██║
███████╗██║ ╚████║██████╔╝██║     ╚██████╔╝██║██║ ╚████║   ██║   ███████║
╚══════╝╚═╝  ╚═══╝╚═════╝ ╚═╝      ╚═════╝ ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝
*/
// Apply TMDB rate limiter for movie and TV show routes
app.use(tmdbLimiter);  
app.use(movieRoutes);
app.use(tvShowRoutes);

// Apply Jikan per second limiter + Jikan per minute limiter for anime routes
app.use(jikanLimiter); 
app.use(jikanMinuteLimiter); 
app.use(animeRoutes);

/*
██╗███╗   ██╗██╗   ██╗ █████╗ ██╗     ██╗██████╗ 
██║████╗  ██║██║   ██║██╔══██╗██║     ██║██╔══██╗
██║██╔██╗ ██║██║   ██║███████║██║     ██║██║  ██║
██║██║╚██╗██║╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║
██║██║ ╚████║ ╚████╔╝ ██║  ██║███████╗██║██████╔╝
╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ 
*/
app.get('*', (request, response) => {
    response.sendFile(path.join(publicDirectoryPath, "404.html"));
});

/*
===========================
--------- LISTEN! ---------
===========================
*/
app.listen(PORT, () => {
    logger.info(`Listening on port ${PORT}`);
});
