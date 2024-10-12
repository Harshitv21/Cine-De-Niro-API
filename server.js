import express from "express";
import axios from "axios";
import dotenv from 'dotenv';
import cors from "cors";
import path from "path";             // Import path module to resolve file paths
import { fileURLToPath } from 'url'; // Needed to resolve file path with ES modules
import winston from "winston";

dotenv.config();

const app = express();

/*
================================================                
  _                           _               
 | |                         (_)              
 | |      ___    __ _   __ _  _  _ __    __ _ 
 | |     / _ \  / _` | / _` || || '_ \  / _` |
 | |____| (_) || (_| || (_| || || | | || (_| |
 |______|\___/  \__, | \__, ||_||_| |_| \__, |
                 __/ |  __/ |            __/ |
                |___/  |___/            |___/ 
================================================              
*/
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
    ]
});

/*
==========================================================================
  __  __   _       _       _   _                                         
 |  \/  | (_)     | |     | | | |                                        
 | \  / |  _    __| |   __| | | |   ___  __      __   __ _   _ __    ___ 
 | |\/| | | |  / _` |  / _` | | |  / _ \ \ \ /\ / /  / _` | | '__|  / _ \
 | |  | | | | | (_| | | (_| | | | |  __/  \ V  V /  | (_| | | |    |  __/
 |_|  |_| |_|  \__,_|  \__,_| |_|  \___|   \_/\_/    \__,_| |_|     \___|                                                 
==========================================================================
 */
app.use(express.json());
// Setting headers to avoid CSP errors (doesn't work tho)
app.use((request, response, next) => {
    response.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
    next();
});
// CORS middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// middleware to log incoming requests
app.use((request, response, next) => {
    logger.info(`[${new Date().toISOString()}] ${request.method} ${request.url} - IP: ${request.ip}`);
    next();
});

const PORT = process.env.PORT || 3000;

/* =============================================== */
/*                  BASE URLS                      */
/* =============================================== */
const tmdbUrl = "https://api.themoviedb.org/3";
const imageUrl = "https://image.tmdb.org/t/p/w500";
const baseJikanUrl = "https://api.jikan.moe/v4";

/* ============================================================== */
/*                      Options for TMDB API                      */
/* ============================================================== */
const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`
    }
};

/* =============================================== */
/*                  BASE ROUTE                     */
/* =============================================== */
// Serve index.html on the root route
app.get("/", (request, response) => {
    response.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ========================================================================================================= 
_______  __  __  _____   ____              _____  _____   _____    ____   _    _  _______  ______   _____ 
|__   __||  \/  ||  __ \ |  _ \      /\    |  __ \|_   _| |  __ \  / __ \ | |  | ||__   __||  ____| / ____|
   | |   | \  / || |  | || |_) |    /  \   | |__) | | |   | |__) || |  | || |  | |   | |   | |__   | (___  
   | |   | |\/| || |  | ||  _ <    / /\ \  |  ___/  | |   |  _  / | |  | || |  | |   | |   |  __|   \___ \ 
   | |   | |  | || |__| || |_) |  / ____ \ | |     _| |_  | | \ \ | |__| || |__| |   | |   | |____  ____) |
   |_|   |_|  |_||_____/ |____/  /_/    \_\|_|    |_____| |_|  \_\ \____/  \____/    |_|   |______||_____/                                                                                                            
/* =========================================================================================================

/* =============================================== */
/*                  Trending movies                */
/* =============================================== */
app.get("/trending/movies", async (request, response) => {
    try {
        const url = `${tmdbUrl}/trending/movie/week?language=en-US`;

        const trending = await axios.get(url, options);
        const trendingData = trending.data.results;

        const trendingMovieArray = trendingData.slice(0, 20).map(movie => ({
            id: movie.id,
            title: movie.title,
            original_title: movie.original_title,
            overview: movie.overview,
            backdrop_path: imageUrl + movie.backdrop_path,
            poster_path: imageUrl + movie.poster_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average
        }));

        logger.info(`Successfully fetched trending movies at ${new Date().toISOString()}`);
        response.send(trendingMovieArray);
    } catch (err) {
        if (err.response) {
            logger.error(`API Error: ${err.response.status} - ${err.response.data}`);
            response.status(err.response.status).send("Error fetching data from API.");
        } else if (err.request) {
            logger.error('No response received from API:', err.request);
            response.status(500).send("No response received from API.");
        } else {
            logger.error(`Error setting up the request: ${err.message}`);
            response.status(500).send("Internal Server Error.");
        }
    }
});

/* =============================================== */
/*                  Popular movies                 */
/* =============================================== */
app.get("/popular/movies", async (request, response) => {
    try {
        const url = `${tmdbUrl}/movie/popular?language=en-US&page=1`;

        const popular = await axios.get(url, options);
        const popularData = popular.data.results;

        const popularMovieArray = popularData.slice(0, 20).map(movie => ({
            id: movie.id,
            original_language: movie.original_language,
            original_title: movie.original_title,
            title: movie.title,
            overview: movie.overview,
            backdrop_path: imageUrl + movie.backdrop_path,
            poster_path: imageUrl + movie.poster_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average
        }));

        logger.info(`Successfully fetched popular movies at ${new Date().toISOString()}`);
        response.send(popularMovieArray);
    } catch (err) {
        if (err.response) {
            logger.error(`API Error: ${err.response.status} - ${err.response.data}`);
            response.status(err.response.status).send("Error fetching data from API.");
        } else if (err.request) {
            logger.error('No response received from API:', err.request);
            response.status(500).send("No response received from API.");
        } else {
            logger.error(`Error setting up the request: ${err.message}`);
            response.status(500).send("Internal Server Error.");
        }
    }
});

/* =============================================== */
/*                  Upcoming movies                */
/* =============================================== */
app.get("/upcoming/movies", async (request, response) => {
    try {
        const url = `${tmdbUrl}/movie/upcoming?language=en-US&page=1`;

        const upcoming = await axios.get(url, options);
        const upcomingData = upcoming.data.results;

        const upcomingMovieArray = upcomingData.slice(0, 20).map(movie => ({
            id: movie.id,
            original_language: movie.original_language,
            original_title: movie.original_title,
            overview: movie.overview,
            title: movie.title,
            backdrop_path: imageUrl + movie.backdrop_path,
            poster_path: imageUrl + movie.poster_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average
        }));

        logger.info(`Successfully fetched upcoming movies at ${new Date().toISOString()}`);
        response.send(upcomingMovieArray);
    } catch (err) {
        if (err.response) {
            logger.error(`API Error: ${err.response.status} - ${err.response.data}`);
            response.status(err.response.status).send("Error fetching data from API.");
        } else if (err.request) {
            logger.error('No response received from API:', err.request);
            response.status(500).send("No response received from API.");
        } else {
            logger.error(`Error setting up the request: ${err.message}`);
            response.status(500).send("Internal Server Error.");
        }
    }
});

/* ============================================== */
/*                  Search Movie                  */
/* ============================================== */
app.get("/search/movies", async (request, response) => {
    const { query } = request.query;

    // Fixed parameters for every request
    const fixedParams = {
        include_adult: 'false',
        language: 'en-US',
        page: 1
    };

    const queryParams = new URLSearchParams({
        ...fixedParams,
        query: query || ''
    }).toString();

    try {
        const searchMovieUrl = `${tmdbUrl}/search/movie?${queryParams}`;
        const searchMovie = await axios.get(searchMovieUrl, options);
        const searchMovieData = searchMovie.data.results;

        const searchedMovieArray = searchMovieData.slice(0, 20).map(movie => ({
            id: movie.id,
            original_language: movie.original_language,
            original_title: movie.original_title,
            overview: movie.overview,
            title: movie.title,
            backdrop_path: imageUrl + movie.backdrop_path,
            poster_path: imageUrl + movie.poster_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average
        }));

        logger.info(`Successfully fetched movies for query "${query}" at ${new Date().toISOString()}`);
        response.send(searchedMovieArray);
    } catch (err) {
        if (err.response) {
            logger.error(`API Error: ${err.response.status} - ${err.response.data}`);
            response.status(err.response.status).send("Error fetching data from API.");
        } else if (err.request) {
            logger.error('No response received from API:', err.request);
            response.status(500).send("No response received from API.");
        } else {
            logger.error(`Error setting up the request: ${err.message}`);
            response.status(500).send("Internal Server Error.");
        }
    }
});

/* =============================================================== */
/*                  Fetch images of a movie by ID                  */
/* =============================================================== */
app.get("/images/movie/:id", async (request, response) => {
    const movieId = request.params.id;

    try {
        const fetchMovieImagesUrl = `${tmdbUrl}/movie/${movieId}/images`;
        const fetchedImages = await axios.get(fetchMovieImagesUrl, options);
        const fetchedImagesData = fetchedImages.data;

        const backdropsArray = fetchedImagesData.backdrops?.slice(0, 30).map(backdrop => ({
            aspect_ratio: backdrop.aspect_ratio,
            height: backdrop.height,
            width: backdrop.width,
            file_path: imageUrl + backdrop.file_path
        })) || []; // Fallback to an empty array

        const postersArray = fetchedImagesData.posters?.slice(0, 30).map(poster => ({
            aspect_ratio: poster.aspect_ratio,
            height: poster.height,
            width: poster.width,
            file_path: imageUrl + poster.file_path
        })) || []; // Fallback to an empty array

        logger.info(`Successfully fetched images for movie ID: "${movieId}" at ${new Date().toISOString()}`);
        response.send({ backdrops: backdropsArray, posters: postersArray });
    } catch (err) {
        if (err.response) {
            logger.error(`API Error: ${err.response.status} - ${err.response.data}`);
            response.status(err.response.status).send("Error fetching data from API.");
        } else if (err.request) {
            logger.error('No response received from API:', err.request);
            response.status(500).send("No response received from API.");
        } else {
            logger.error(`Error setting up the request: ${err.message}`);
            response.status(500).send("Internal Server Error.");
        }
    }
});

/* =============================================== */
/*                  Trending TV                    */
/* =============================================== */
app.get("/trending/tv", async (request, response) => {
    try {
        const url = `${tmdbUrl}/trending/tv/week?language=en-US`;

        const trending = await axios.get(url, options);
        const trendingData = trending.data.results;

        const trendingTVArray = trendingData.slice(0, 20).map(tv => ({
            id: tv.id,
            title: tv.name,
            original_name: tv.original_name,
            overview: tv.overview,
            backdrop_path: imageUrl + tv.backdrop_path,
            poster_path: imageUrl + tv.poster_path,
            release_date: tv.first_air_date,
            vote_average: tv.vote_average
        }));

        logger.info(`Successfully fetched trending TV shows at ${new Date().toISOString()}`);
        response.send(trendingTVArray);
    } catch (err) {
        if (err.response) {
            logger.error(`API Error: ${err.response.status} - ${err.response.data}`);
            response.status(err.response.status).send("Error fetching data from API.");
        } else if (err.request) {
            logger.error('No response received from API:', err.request);
            response.status(500).send("No response received from API.");
        } else {
            logger.error(`Error setting up the request: ${err.message}`);
            response.status(500).send("Internal Server Error.");
        }
    }
});

/* =============================================== */
/*                  Popular TV                     */
/* =============================================== */
app.get("/popular/tv", async (request, response) => {
    try {
        const url = `${tmdbUrl}/tv/top_rated?language=en-US&page=1`;

        const popular = await axios.get(url, options);
        const popularData = popular.data.results;

        const popularTVArray = popularData.slice(0, 20).map(tv => ({
            id: tv.id,
            title: tv.name,
            original_language: tv.original_language,
            name: tv.name,
            original_name: tv.original_name,
            overview: tv.overview,
            backdrop_path: imageUrl + tv.backdrop_path,
            poster_path: imageUrl + tv.poster_path,
            release_date: tv.first_air_date,
            vote_average: tv.vote_average
        }));

        logger.info(`Successfully fetched popular TV shows at ${new Date().toISOString()}`);
        response.send(popularTVArray);
    } catch (err) {
        if (err.response) {
            logger.error(`API Error: ${err.response.status} - ${err.response.data}`);
            response.status(err.response.status).send("Error fetching data from API.");
        } else if (err.request) {
            logger.error('No response received from API:', err.request);
            response.status(500).send("No response received from API.");
        } else {
            logger.error(`Error setting up the request: ${err.message}`);
            response.status(500).send("Internal Server Error.");
        }
    }
});

/* =========================================== */
/*                  Search TV                  */
/* =========================================== */
app.get("/search/tv", async (request, response) => {
    const { query } = request.query;

    // Fixed parameters for every request
    const fixedParams = {
        include_adult: 'false',
        language: 'en-US',
        page: 1
    };

    const queryParams = new URLSearchParams({
        ...fixedParams,
        query: query || ''
    }).toString();

    try {
        const searchTvUrl = `${tmdbUrl}/search/tv?${queryParams}`;
        const searchTv = await axios.get(searchTvUrl, options);
        const searchTvData = searchTv.data.results;

        const searchedTvArray = searchTvData.slice(0, 20).map(tv => ({
            id: tv.id,
            original_language: tv.original_language,
            original_name: tv.original_name,
            overview: tv.overview,
            name: tv.name,
            backdrop_path: imageUrl + tv.backdrop_path,
            poster_path: imageUrl + tv.poster_path,
            first_air_date: tv.first_air_date,
            vote_average: tv.vote_average
        }));

        logger.info(`Successfully fetched TV shows for query "${query}" at ${new Date().toISOString()}`);
        response.send(searchedTvArray);
    } catch (err) {
        if (err.response) {
            logger.error(`API Error: ${err.response.status} - ${err.response.data}`);
            response.status(err.response.status).send("Error fetching data from API.");
        } else if (err.request) {
            logger.error('No response received from API:', err.request);
            response.status(500).send("No response received from API.");
        } else {
            logger.error(`Error setting up the request: ${err.message}`);
            response.status(500).send("Internal Server Error.");
        }
    }
});

/* =============================================================== */
/*                  Fetch images of a TV show by ID               */
/* =============================================================== */
app.get("/images/tv/:id", async (request, response) => {
    const tvId = request.params.id;

    try {
        const fetchTvImagesUrl = `${tmdbUrl}/tv/${tvId}/images`;
        const fetchedImages = await axios.get(fetchTvImagesUrl, options);
        const fetchedImagesData = fetchedImages.data;

        const backdropsArray = fetchedImagesData.backdrops?.slice(0, 30).map(backdrop => ({
            aspect_ratio: backdrop.aspect_ratio,
            height: backdrop.height,
            width: backdrop.width,
            file_path: imageUrl + backdrop.file_path,
        })) || []; // Fallback to an empty array

        const postersArray = fetchedImagesData.posters?.slice(0, 30).map(poster => ({
            aspect_ratio: poster.aspect_ratio,
            height: poster.height,
            width: poster.width,
            file_path: imageUrl + poster.file_path,
        })) || []; // Fallback to an empty array

        logger.info(`Successfully fetched images for TV show ID: "${tvId}" at ${new Date().toISOString()}`);
        
        response.send({ backdrops: backdropsArray, posters: postersArray });
    } catch (err) {
        if (err.response) {
            logger.error(`API Error: ${err.response.status} - ${err.response.data}`);
            response.status(err.response.status).send("Error fetching data from API.");
        } else if (err.request) {
            logger.error('No response received from API:', err.request);
            response.status(500).send("No response received from API.");
        } else {
            logger.error(`Error setting up the request: ${err.message}`);
            response.status(500).send("Internal Server Error.");
        }
    }
});

/* ===============================================================================================================
       _  _____  _  __           _   _             _____  _____   _____    ____   _    _  _______  ______   _____ 
      | ||_   _|| |/ /    /\    | \ | |     /\    |  __ \|_   _| |  __ \  / __ \ | |  | ||__   __||  ____| / ____|
      | |  | |  | ' /    /  \   |  \| |    /  \   | |__) | | |   | |__) || |  | || |  | |   | |   | |__   | (___  
  _   | |  | |  |  <    / /\ \  | . ` |   / /\ \  |  ___/  | |   |  _  / | |  | || |  | |   | |   |  __|   \___ \ 
 | |__| | _| |_ | . \  / ____ \ | |\  |  / ____ \ | |     _| |_  | | \ \ | |__| || |__| |   | |   | |____  ____) |
  \____/ |_____||_|\_\/_/    \_\|_| \_| /_/    \_\|_|    |_____| |_|  \_\ \____/  \____/    |_|   |______||_____/ 
/* ===============================================================================================================

/* =============================================== */
/*                  Trending anime                 */
/* =============================================== */
app.get("/trending/anime", async (request, response) => {
    try {
        const trendingAnimeUrl = `${baseJikanUrl}/seasons/now`;
        const trending = await axios.get(trendingAnimeUrl);
        const trendingAnimeData = trending.data.data;

        const trendingAnimeArray = trendingAnimeData.slice(0, 20).map(anime => ({
            mal_id: anime.mal_id,
            mal_url: anime.url,
            images: [
                anime.images.jpg.image_url,
                anime.images.jpg.large_image_url,
                anime.trailer.images?.maximum_image_url || null
            ],
            trailer: {
                yt_id: anime.trailer.youtube_id,
                yt_url: anime.trailer.url,
                embed_url: anime.trailer.embed_url
            },
            titles: {
                default_title: anime.title,
                japanese_title: anime.title_japanese,
                english_title: anime.title_english
            },
            episodes: anime.episodes,
            rating: anime.rating,
            type: anime.type,
            source: anime.source,
            status: anime.status,
            score: anime.score,
            rank: anime.rank,
            popularity: anime.popularity,
            synopsis: anime.synopsis,
            backgroud: anime.backgroud,
            season: anime.season,
            year: anime.year,
            genres: anime.genres.map(genre => genre.name),
            themes: anime.themes.map(theme => theme.name),
            demographics: anime.demographics.map(demographic => demographic.name),
            explicit_genres: anime.explicit_genres.map(genre => genre.name)
        }));

        logger.info(`Successfully fetched trending animes at ${new Date().toISOString()}`);
        response.send(trendingAnimeArray);
    } catch (err) {
        if (err.response) {
            logger.error(`API Error: ${err.response.status} - ${err.response.data}`);
            response.status(err.response.status).send("Error fetching data from API.");
        } else if (err.request) {
            logger.error('No response received from API:', err.request);
            response.status(500).send("No response received from API.");
        } else {
            logger.error(`Error setting up the request: ${err.message}`);
            response.status(500).send("Internal Server Error.");
        }
    }
});

/* =============================================== */
/*                  Popular anime                  */
/* =============================================== */
app.get("/popular/anime", async (request, response) => {
    try {
        const popularAnimeUrl = `${baseJikanUrl}/top/anime`;
        const popular = await axios.get(popularAnimeUrl);
        const popularAnimeData = popular.data.data;

        const popularAnimeArray = popularAnimeData.slice(0, 20).map(anime => ({
            mal_id: anime.mal_id,
            mal_url: anime.url,
            images: [
                anime.images.jpg.image_url,
                anime.images.jpg.large_image_url,
                anime.trailer.images?.maximum_image_url || null
            ],
            trailer: {
                yt_id: anime.trailer.youtube_id,
                yt_url: anime.trailer.url,
                embed_url: anime.trailer.embed_url
            },
            titles: {
                default_title: anime.title,
                japanese_title: anime.title_japanese,
                english_title: anime.title_english
            },
            episodes: anime.episodes,
            rating: anime.rating,
            type: anime.type,
            source: anime.source,
            status: anime.status,
            score: anime.score,
            rank: anime.rank,
            popularity: anime.popularity,
            synopsis: anime.synopsis,
            backgroud: anime.backgroud,
            season: anime.season,
            year: anime.year,
            genres: anime.genres.map(genre => genre.name),
            themes: anime.themes.map(theme => theme.name),
            demographics: anime.demographics.map(demographic => demographic.name),
            explicit_genres: anime.explicit_genres.map(genre => genre.name)
        }));

        logger.info(`Successfully fetched popular animes at ${new Date().toISOString()}`);
        response.send(popularAnimeArray);
    } catch (err) {
        if (err.response) {
            logger.error(`API Error: ${err.response.status} - ${err.response.data}`);
            response.status(err.response.status).send("Error fetching data from API.");
        } else if (err.request) {
            logger.error('No response received from API:', err.request);
            response.status(500).send("No response received from API.");
        } else {
            logger.error(`Error setting up the request: ${err.message}`);
            response.status(500).send("Internal Server Error.");
        }
    }
});

/* =============================================== */
/*                  Upcoming anime                 */
/* =============================================== */
app.get("/upcoming/anime", async (request, response) => {
    try {
        const upcomingAnimeUrl = `${baseJikanUrl}/seasons/upcoming`;
        const upcoming = await axios.get(upcomingAnimeUrl);
        const upcomingAnimeData = upcoming.data.data;

        const upcomingAnimeArray = upcomingAnimeData.slice(0, 20).map(anime => ({
            mal_id: anime.mal_id,
            mal_url: anime.url,
            images: [
                anime.images.jpg.image_url,
                anime.images.jpg.large_image_url,
                anime.trailer.images?.maximum_image_url || null
            ],
            trailer: {
                yt_id: anime.trailer.youtube_id,
                yt_url: anime.trailer.url,
                embed_url: anime.trailer.embed_url
            },
            titles: {
                default_title: anime.title,
                japanese_title: anime.title_japanese,
                english_title: anime.title_english
            },
            episodes: anime.episodes,
            rating: anime.rating,
            type: anime.type,
            source: anime.source,
            status: anime.status,
            score: anime.score,
            rank: anime.rank,
            popularity: anime.popularity,
            synopsis: anime.synopsis,
            backgroud: anime.backgroud,
            season: anime.season,
            year: anime.year,
            genres: anime.genres.map(genre => genre.name),
            themes: anime.themes.map(theme => theme.name),
            demographics: anime.demographics.map(demographic => demographic.name),
            explicit_genres: anime.explicit_genres.map(genre => genre.name)
        }));

        logger.info(`Successfully fetched upcoming animes at ${new Date().toISOString()}`);
        response.send(upcomingAnimeArray);
    } catch (err) {
        if (err.response) {
            logger.error(`API Error: ${err.response.status} - ${err.response.data}`);
            response.status(err.response.status).send("Error fetching data from API.");
        } else if (err.request) {
            logger.error('No response received from API:', err.request);
            response.status(500).send("No response received from API.");
        } else {
            logger.error(`Error setting up the request: ${err.message}`);
            response.status(500).send("Internal Server Error.");
        }
    }
});

/* ================================================== */
/*                 Search anime by id                 */
/* ================================================== */
app.get("/search/anime/:id", async (request, response) => {
    const animeId = request.params.id;

    try {
        const searchAnime = await axios.get(`${baseJikanUrl}/anime/${animeId}`);
        const searchImages = await axios.get(`${baseJikanUrl}/anime/${animeId}/pictures`);
        const searchVideos = await axios.get(`${baseJikanUrl}/anime/${animeId}/videos`);

        const imagesData = searchImages.data.data;
        const searchAnimeData = searchAnime.data;
        const videosData = searchVideos.data.data;

        const organizedImages = {
            jpgs: imagesData.map(image => ({
                image_url: image.jpg.image_url,
                small_image_url: image.jpg.small_image_url,
                large_image_url: image.jpg.large_image_url
            })),
            webp: imagesData.map(image => ({
                image_url: image.webp.image_url,
                small_image_url: image.webp.small_image_url,
                large_image_url: image.webp.large_image_url
            }))
        };        

        searchAnimeData.images_data = organizedImages;
        searchAnimeData.videos = videosData;

        logger.info(`Successfully fetched anime for ID "${animeId}" at ${new Date().toISOString()}`);
        response.send(searchAnimeData);
    } catch (err) {
        if (err.response) {
            logger.error(`API Error: ${err.response.status} - ${err.response.data}`);
            response.status(err.response.status).send("Error fetching data from API.");
        } else if (err.request) {
            logger.error('No response received from API:', err.request);
            response.status(500).send("No response received from API.");
        } else {
            logger.error(`Error setting up the request: ${err.message}`);
            response.status(500).send("Internal Server Error.");
        }
    }
});

/* ===================================================== */
/*                 Search anime by query                 */
/* ===================================================== */
app.get("/search/anime", async (request, response) => {
    const queryParams = request.query;
    // constructing the query string
    const queryString = new URLSearchParams(queryParams).toString();
    try {
        const searchAnimeUrl = queryString
            ? `${baseJikanUrl}/anime?${queryString}`
            : `${baseJikanUrl}/anime`;
        const searchAnime = await axios.get(searchAnimeUrl);
        const searchAnimeData = searchAnime.data;

        logger.info(`Successfully fetched anime for query(s) "${queryParams}" at ${new Date().toISOString()}`);
        response.send(searchAnimeData);
    } catch (err) {
        if (err.response) {
            logger.error(`API Error: ${err.response.status} - ${err.response.data}`);
            response.status(err.response.status).send("Error fetching data from API.");
        } else if (err.request) {
            logger.error('No response received from API:', err.request);
            response.status(500).send("No response received from API.");
        } else {
            logger.error(`Error setting up the request: ${err.message}`);
            response.status(500).send("Internal Server Error.");
        }
    }
});

/* ================================================================================= */
/*                 Default path to handle invalid endpoints requests                 */
/* ================================================================================= */
app.get('*', (request, response) => {
    response.sendFile(path.join(__dirname, 'public', '404.html'));
});

/* ============================================= */
/*                    LISTEN!                    */
/* ============================================= */
app.listen(PORT, () => {
    logger.info(`Listening on port ${PORT}`);
});
