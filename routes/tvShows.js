/*
████████╗██╗   ██╗    ███████╗██╗  ██╗ ██████╗ ██╗    ██╗███████╗
╚══██╔══╝██║   ██║    ██╔════╝██║  ██║██╔═══██╗██║    ██║██╔════╝
   ██║   ██║   ██║    ███████╗███████║██║   ██║██║ █╗ ██║███████╗
   ██║   ╚██╗ ██╔╝    ╚════██║██╔══██║██║   ██║██║███╗██║╚════██║
   ██║    ╚████╔╝     ███████║██║  ██║╚██████╔╝╚███╔███╔╝███████║
   ╚═╝     ╚═══╝      ╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝ ╚══════╝
*/

import express from 'express';
import axios from 'axios';
import logger from '../utils/logger.js';
import { URLs, options } from '../config/constants.js';

const router = express.Router();

/* =============================================== */
/*                  Trending TV                    */
/* =============================================== */
router.get("/trending/tv/:time_window?", async (request, response) => {
    const time_window = request.params.time_window || 'week';

    // Validate that the time_window is either 'week' or 'day'
    const allowedValues = ['week', 'day'];

    if (!allowedValues.includes(time_window)) {
        return response.status(400).send({
            error: `Invalid time_window value: "${time_window}". Allowed values are: ${allowedValues.join(", ")}`
        });
    }

    // Create a Redis key based on the time_window
    const redisKey = `trending_tv_${time_window}`;

    try {
        const cachedData = await redisClient.get(redisKey);
        if (cachedData) {
            logger.info("Serving trending TV data from cache 🎥📺");
            return response.send(JSON.parse(cachedData));
        }

        const url = `${URLs.tmdb}/trending/tv/${time_window}?language=en-US`;
        const trending = await axios.get(url, options);
        const trendingData = trending.data.results;

        const modifiedTrendingData = trendingData.map(tv => ({
            ...tv,
            backdrop_path: tv.backdrop_path ? URLs.image + tv.backdrop_path : null,
            poster_path: tv.poster_path ? URLs.image + tv.poster_path : null
        }));

        logger.info(`Successfully fetched trending TV shows at ${new Date().toISOString()}`);

        await redisClient.set(redisKey, JSON.stringify(modifiedTrendingData), 'EX', 3600);

        response.send(modifiedTrendingData);
    } catch (err) {
        handleError(err, response);
    }
});

/* =============================================== */
/*                  Popular TV                     */
/* =============================================== */
router.get("/popular/tv", async (request, response) => {
    const { page = 1 } = request.query;

    // Create a Redis key based on the current page
    const redisKey = `popular_tv_${page}`;

    try {
        const cachedData = await redisClient.get(redisKey);
        if (cachedData) {
            logger.info("Serving popular TV data from cache 📺✨");
            return response.send(JSON.parse(cachedData));
        }

        const url = `${URLs.tmdb}/tv/top_rated?language=en-US&page=${page}`;
        const popular = await axios.get(url, options);
        const popularData = popular.data;

        // Check if the requested page exists
        if (page > popularData.total_pages) {
            return response.status(404).json({
                pagination: {
                    current_page: page,
                    last_visible_page: popularData.total_pages,
                    has_next_page: false,
                    items: {
                        total_pages: popularData.total_pages,
                        total_results: popularData.total_results,
                    }
                },
                results: [],
                message: "No results found for the requested page."
            });
        }

        const modifiedPopularData = popularData.results.map(tv => ({
            ...tv,
            backdrop_path: tv.backdrop_path ? URLs.image + tv.backdrop_path : null,
            poster_path: tv.poster_path ? URLs.image + tv.poster_path : null
        }));

        const pageInfo = {
            current_page: popularData.page,
            total_pages: popularData.total_pages,
            total_results: popularData.total_results
        };

        logger.info(`Successfully fetched popular TV shows at ${new Date().toISOString()}`);

        await redisClient.set(redisKey, JSON.stringify({ pagination: pageInfo, popular_tv_shows: modifiedPopularData }), 'EX', 3600);

        response.send({ pagination: pageInfo, popular_tv_shows: modifiedPopularData });
    } catch (err) {
        handleError(err, response);
    }
});

/* =========================================== */
/*                  Search TV                  */
/* =========================================== */
router.get("/search/tv", async (request, response) => {
    const {
        page = 1,
        limit = 25,
        query,
        first_air_date_year,
        region,
        year,
        include_adult
    } = request.query;

    // Fixed parameters for every request
    const fixedParams = {
        language: 'en-US',
    };

    const queryParams = new URLSearchParams({
        ...fixedParams,
        query: query || '',
        first_air_date_year: first_air_date_year || '',
        region: region || '',
        year: year || '',
        page: page || 1,
        include_adult: include_adult || false
    }).toString();

    if (!query) {
        return response.status(400).send({
            error: "No query provided! ☹️"
        });
    }

    // Generate Redis key based on existing query parameters
    const redisKeyParts = [`search_tv_${page}`];

    if (query) redisKeyParts.push(`query_${query}`);
    if (first_air_date_year) redisKeyParts.push(`first_air_date_year_${first_air_date_year}`);
    if (region) redisKeyParts.push(`region_${region}`);
    if (year) redisKeyParts.push(`year_${year}`);
    if (include_adult) redisKeyParts.push(`include_adult`);

    const redisKey = redisKeyParts.join('_');

    try {
        const cachedData = await redisClient.get(redisKey);
        if (cachedData) {
            logger.info("Serving TV search data from cache 📺🍿");
            return response.send(JSON.parse(cachedData));
        }

        const searchTvUrl = `${URLs.tmdb}/search/tv?${queryParams}`;
        const searchTv = await axios.get(searchTvUrl, options);
        const searchTvData = searchTv.data;

        // Check if the requested page exists
        if (page > searchTvData.total_pages) {
            return response.status(404).json({
                pagination: {
                    current_page: page,
                    last_visible_page: searchTvData.total_pages,
                    has_next_page: false,
                    items: {
                        total_pages: searchTvData.total_pages,
                        total_results: searchTvData.total_results,
                    }
                },
                results: [],
                message: "No results found for the requested page."
            });
        }

        const formattedTVShows = searchTvData.results.map(tv => ({
            ...tv,
            backdrop_path: tv.backdrop_path ? URLs.image + tv.backdrop_path : null,
            poster_path: tv.poster_path ? URLs.image + tv.poster_path : null
        }));

        const pageInfo = {
            current_page: searchTvData.page,
            total_pages: searchTvData.total_pages,
            total_results: searchTvData.total_results
        };

        await redisClient.set(redisKey, JSON.stringify({ pagination: pageInfo, search_result: formattedTVShows }), 'EX', 3600);

        logger.info(`Successfully fetched TV shows for query "${query}" at ${new Date().toISOString()}`);
        response.send({ pagination: pageInfo, search_result: formattedTVShows });
    } catch (err) {
        handleError(err, response);
    }
});

/* =============================================================== */
/*                  Fetch images of a TV show by ID                */
/* =============================================================== */
router.get("/images/tv/:id", async (request, response) => {
    const tvId = request.params.id;

    const queryParams = new URLSearchParams({
        include_image_language: "en"
    }).toString();

    // Generate Redis key based on TV show ID
    const redisKey = `tv_images_${tvId}`;

    try {
        const cachedData = await redisClient.get(redisKey);
        if (cachedData) {
            logger.info("Serving TV images data from cache 📸🎞️");
            return response.send(JSON.parse(cachedData));
        }

        const fetchTvImagesUrl = `${URLs.tmdb}/tv/${tvId}/images?${queryParams}`;
        const fetchedImages = await axios.get(fetchTvImagesUrl, options);
        const fetchedImagesData = fetchedImages.data;

        const backdropsArray = fetchedImagesData.backdrops?.map(backdrop => ({
            aspect_ratio: backdrop.aspect_ratio,
            height: backdrop.height,
            width: backdrop.width,
            file_path: URLs.image + backdrop.file_path,
        })) || []; // Fallback to an empty array

        const postersArray = fetchedImagesData.posters?.map(poster => ({
            aspect_ratio: poster.aspect_ratio,
            height: poster.height,
            width: poster.width,
            file_path: URLs.image + poster.file_path,
        })) || []; // Fallback to an empty array

        logger.info(`Successfully fetched images for TV show ID: "${tvId}" at ${new Date().toISOString()}`);

        await redisClient.set(redisKey, JSON.stringify({ backdrops: backdropsArray, posters: postersArray }), 'EX', 3600);

        response.send({ backdrops: backdropsArray, posters: postersArray });
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