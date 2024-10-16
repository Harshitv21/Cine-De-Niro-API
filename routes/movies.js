/*
███╗   ███╗ ██████╗ ██╗   ██╗██╗███████╗███████╗
████╗ ████║██╔═══██╗██║   ██║██║██╔════╝██╔════╝
██╔████╔██║██║   ██║██║   ██║██║█████╗  ███████╗
██║╚██╔╝██║██║   ██║╚██╗ ██╔╝██║██╔══╝  ╚════██║
██║ ╚═╝ ██║╚██████╔╝ ╚████╔╝ ██║███████╗███████║
╚═╝     ╚═╝ ╚═════╝   ╚═══╝  ╚═╝╚══════╝╚══════╝
*/

import express from 'express';
import axios from 'axios';
import logger from '../utils/logger.js';
import { URLs, options } from '../config/constants.js';

const router = express.Router();

/* =============================================== */
/*                  Trending movies                */
/* =============================================== */
router.get("/trending/movies/:time_window?", async (request, response) => {
    const time_window = request.params.time_window || 'week';

    // Validate that the time_window is either 'week' or 'day'
    const allowedValues = ['week', 'day'];
    if (!allowedValues.includes(time_window)) {
        return response.status(400).send({
            error: `Invalid time_window value: "${time_window}". Allowed values are: ${allowedValues.join(", ")}`
        });
    }

    // Generate a Redis key based on the time_window
    const redisKey = `trending_movies_${time_window}`;

    try {
        const cachedData = await redisClient.get(redisKey);
        if (cachedData) {
            logger.info("Serving trending movies data from cache 🎥🍿");
            return response.send(JSON.parse(cachedData));
        }

        const url = `${URLs.tmdb}/trending/movie/${time_window}?language=en-US`;
        const trending = await axios.get(url, options);
        const trendingData = trending.data.results;

        const modifiedTrendingData = trendingData.map(movie => ({
            ...movie,
            backdrop_path: movie.backdrop_path ? URLs.image + movie.backdrop_path : null,
            poster_path: movie.poster_path ? URLs.image + movie.poster_path : null,
        }));

        await redisClient.set(redisKey, JSON.stringify(modifiedTrendingData), 'EX', 3600);

        logger.info(`Fetched trending movies for time_window "${time_window}" at ${new Date().toISOString()}`);
        response.send(modifiedTrendingData);
    } catch (err) {
        handleError(err, response);
    }
});

/* =============================================== */
/*                  Popular movies                 */
/* =============================================== */
router.get("/popular/movies", async (request, response) => {
    const { page = 1 } = request.query;

    // Generate a Redis key based on the page number
    const redisKey = `popular_movies_page_${page}`;

    try {
        const cachedData = await redisClient.get(redisKey);
        if (cachedData) {
            logger.info("Serving popular movies data from cache 🎬🍿");
            return response.send(JSON.parse(cachedData));
        }

        const url = `${URLs.tmdb}/movie/popular?language=en-US&page=${page}`;
        const popular = await axios.get(url, options);
        const popularData = popular.data;

        if (page > popularData.total_pages) {
            return response.status(404).json({
                pagination: {
                    current_page: page,
                    last_visible_page: popularData.total_pages,
                    has_next_page: false,
                    items: {
                        total_pages: popularData.total_pages,
                        total_results: popularData.total_results,
                    },
                },
                results: [],
                message: "No results found for the requested page."
            });
        }

        const modifiedPopularData = popularData.results.map(movie => ({
            ...movie,
            backdrop_path: movie.backdrop_path ? URLs.image + movie.backdrop_path : null,
            poster_path: movie.poster_path ? URLs.image + movie.poster_path : null
        }));

        const pageInfo = {
            current_page: popularData.page,
            total_pages: popularData.total_pages,
            total_results: popularData.total_results
        };

        const responseData = { pagination: pageInfo, popular_movies: modifiedPopularData };

        await redisClient.set(redisKey, JSON.stringify(responseData), 'EX', 3600);

        logger.info(`Fetched popular movies at page=${page} at ${new Date().toISOString()}`);
        response.send(responseData);
    } catch (err) {
        handleError(err, response);
    }
});

/* =============================================== */
/*                  Upcoming movies                */
/* =============================================== */
router.get("/upcoming/movies", async (request, response) => {
    const { page = 1 } = request.query;

    // Generate a Redis key based on the page number
    const redisKey = `upcoming_movies_page_${page}`;

    try {
        const cachedData = await redisClient.get(redisKey);
        if (cachedData) {
            logger.info("Serving upcoming movies data from cache 🎬🍿");
            return response.send(JSON.parse(cachedData));
        }

        const url = `${URLs.tmdb}/movie/upcoming?language=en-US&page=${page}`;
        const upcoming = await axios.get(url, options);
        const upcomingData = upcoming.data;

        // Check if the requested page exists
        if (page > upcomingData.total_pages) {
            return response.status(404).json({
                pagination: {
                    current_page: page,
                    last_visible_page: upcomingData.total_pages,
                    has_next_page: false,
                    items: {
                        total_pages: upcomingData.total_pages,
                        total_results: upcomingData.total_results,
                    },
                },
                results: [],
                message: "No results found for the requested page."
            });
        }

        const modifiedUpcomingData = upcomingData.results.map(movie => ({
            ...movie,
            backdrop_path: movie.backdrop_path ? URLs.image + movie.backdrop_path : null,
            poster_path: movie.poster_path ? URLs.image + movie.poster_path : null
        }));

        const pageInfo = {
            current_page: upcomingData.page,
            total_pages: upcomingData.total_pages,
            total_results: upcomingData.total_results,
        };

        const responseData = { pagination: pageInfo, upcoming_movies: modifiedUpcomingData };

        await redisClient.set(redisKey, JSON.stringify(responseData), 'EX', 3600);

        logger.info(`Fetched upcoming movies at page=${page} at ${new Date().toISOString()}`);
        response.send(responseData);
    } catch (err) {
        handleError(err, response);
    }
});

/* ============================================== */
/*                  Search Movie                  */
/* ============================================== */
router.get("/search/movies", async (request, response) => {
    const { page = 1, query, primary_release_year, region, year, include_adult } = request.query;

    if (!query) {
        return response.status(400).send({
            error: "No query provided! ☹️"
        });
    }

    // Fixed parameters for every request
    const fixedParams = {
        language: 'en-US',
    };

    // Generate a Redis key based on the query parameters
    const redisKeyParts = [`search_movies`, `page_${page}`, `query_${query}`];

    if (primary_release_year) redisKeyParts.push(`primary_release_year_${primary_release_year}`);
    if (region) redisKeyParts.push(`region_${region}`);
    if (year) redisKeyParts.push(`year_${year}`);
    if (include_adult) redisKeyParts.push(`include_adult`);

    const redisKey = redisKeyParts.join('_');

    // Create query parameters for the API request
    const queryParams = new URLSearchParams({
        ...fixedParams,
        query: query || '',
        primary_release_year: primary_release_year || '',
        region: region || '',
        year: year || '',
        page: page || 1,
        include_adult: include_adult || false
    }).toString();

    try {
        const cachedData = await redisClient.get(redisKey);
        if (cachedData) {
            logger.info("Serving search movie data from cache 🎬🍿");
            return response.send(JSON.parse(cachedData));
        }

        const searchMovieUrl = `${URLs.tmdb}/search/movie?${queryParams}`;
        const searchMovie = await axios.get(searchMovieUrl, options);
        const searchMovieData = searchMovie.data;

        // Check if the requested page exists
        if (page > searchMovieData.total_pages) {
            return response.status(404).json({
                pagination: {
                    current_page: page,
                    last_visible_page: searchMovieData.total_pages,
                    has_next_page: false,
                    items: {
                        total_pages: searchMovieData.total_pages,
                        total_results: searchMovieData.total_results,
                    }
                },
                results: [],
                message: "No results found for the requested page."
            });
        }

        const formattedMovies = searchMovieData.results.map(movie => ({
            ...movie,
            backdrop_path: movie.backdrop_path ? URLs.image + movie.backdrop_path : null,
            poster_path: movie.poster_path ? URLs.image + movie.poster_path : null
        }));

        const pageInfo = {
            current_page: searchMovieData.page,
            total_pages: searchMovieData.total_pages,
            total_results: searchMovieData.total_results
        };

        const responseData = { pagination: pageInfo, search_result: formattedMovies };

        await redisClient.set(redisKey, JSON.stringify(responseData), 'EX', 3600);

        logger.info(`Fetched movies for query "${query}" with page ${page} at ${new Date().toISOString()}`);
        response.send(responseData);
    } catch (err) {
        handleError(err, response);
    }
});

/* =============================================================== */
/*                  Fetch images of a movie by ID                  */
/* =============================================================== */
router.get("/images/movie/:id", async (request, response) => {
    const movieId = request.params.id;

    // Create a Redis key based on the movie ID
    const redisKey = `movie_images_${movieId}`;

    try {
        const cachedData = await redisClient.get(redisKey);
        if (cachedData) {
            logger.info("Serving movie images from cache 🎥📸");
            return response.send(JSON.parse(cachedData));
        }

        const queryParams = new URLSearchParams({
            include_image_language: "en"
        }).toString();

        const fetchMovieImagesUrl = `${URLs.tmdb}/movie/${movieId}/images?${queryParams}`;
        const fetchedImages = await axios.get(fetchMovieImagesUrl, options);
        const fetchedImagesData = fetchedImages.data;

        const backdropsArray = fetchedImagesData.backdrops?.map(backdrop => ({
            aspect_ratio: backdrop.aspect_ratio,
            height: backdrop.height,
            width: backdrop.width,
            file_path: URLs.image + backdrop.file_path
        })) || []; // Fallback to an empty array

        const postersArray = fetchedImagesData.posters?.map(poster => ({
            aspect_ratio: poster.aspect_ratio,
            height: poster.height,
            width: poster.width,
            file_path: URLs.image + poster.file_path
        })) || []; // Fallback to an empty array

        logger.info(`Successfully fetched images for movie ID: "${movieId}" at ${new Date().toISOString()}`);

        const responseData = { backdrops: backdropsArray, posters: postersArray };

        await redisClient.set(redisKey, JSON.stringify(responseData), 'EX', 3600);

        response.send(responseData);
    } catch (err) {
        handleError(err, response);
    }
});

/* ============================================ */
/*                 Handle Error                 */
/* ============================================ */
function handleError(err, response) {
    if (err.response) {
        logger.error(`API Error: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
        response.status(err.response.status).send("Error fetching data from API.");
    } else if (err.request) {
        logger.error('No response received from API:', err.request);
        response.status(500).send("No response received from API.");
    } else {
        logger.error(`Error: ${err.message}`);
        response.status(500).send("Internal Server Error.");
    }
}

export default router;
