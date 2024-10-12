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
router.get("/trending/tv", async (request, response) => {
    try {
        const url = `${URLs.tmdb}/trending/tv/week?language=en-US`;

        const trending = await axios.get(url, options);
        const trendingData = trending.data.results;

        const trendingTVArray = trendingData.slice(0, 20).map(tv => ({
            id: tv.id,
            title: tv.name,
            original_name: tv.original_name,
            overview: tv.overview,
            backdrop_path: URLs.image + tv.backdrop_path,
            poster_path: URLs.image + tv.poster_path,
            release_date: tv.first_air_date,
            vote_average: tv.vote_average
        }));

        logger.info(`Successfully fetched trending TV shows at ${new Date().toISOString()}`);
        response.send(trendingTVArray);
    } catch (err) {
        handleError(err, response);
    }
});

/* =============================================== */
/*                  Popular TV                     */
/* =============================================== */
router.get("/popular/tv", async (request, response) => {
    try {
        const url = `${URLs.tmdb}/tv/top_rated?language=en-US&page=1`;

        const popular = await axios.get(url, options);
        const popularData = popular.data.results;

        const popularTVArray = popularData.slice(0, 20).map(tv => ({
            id: tv.id,
            title: tv.name,
            original_language: tv.original_language,
            name: tv.name,
            original_name: tv.original_name,
            overview: tv.overview,
            backdrop_path: URLs.image + tv.backdrop_path,
            poster_path: URLs.image + tv.poster_path,
            release_date: tv.first_air_date,
            vote_average: tv.vote_average
        }));

        logger.info(`Successfully fetched popular TV shows at ${new Date().toISOString()}`);
        response.send(popularTVArray);
    } catch (err) {
        handleError(err, response);
    }
});

/* =========================================== */
/*                  Search TV                  */
/* =========================================== */
router.get("/search/tv", async (request, response) => {
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
        const searchTvUrl = `${URLs.tmdb}/search/tv?${queryParams}`;
        const searchTv = await axios.get(searchTvUrl, options);
        const searchTvData = searchTv.data.results;

        const searchedTvArray = searchTvData.slice(0, 20).map(tv => ({
            id: tv.id,
            original_language: tv.original_language,
            original_name: tv.original_name,
            overview: tv.overview,
            name: tv.name,
            backdrop_path: URLs.image + tv.backdrop_path,
            poster_path: URLs.image + tv.poster_path,
            first_air_date: tv.first_air_date,
            vote_average: tv.vote_average
        }));

        logger.info(`Successfully fetched TV shows for query "${query}" at ${new Date().toISOString()}`);
        response.send(searchedTvArray);
    } catch (err) {
        handleError(err, response);
    }
});

/* =============================================================== */
/*                  Fetch images of a TV show by ID               */
/* =============================================================== */
router.get("/images/tv/:id", async (request, response) => {
    const tvId = request.params.id;

    try {
        const fetchTvImagesUrl = `${URLs.tmdb}/tv/${tvId}/images`;
        const fetchedImages = await axios.get(fetchTvImagesUrl, options);
        const fetchedImagesData = fetchedImages.data;

        const backdropsArray = fetchedImagesData.backdrops?.slice(0, 30).map(backdrop => ({
            aspect_ratio: backdrop.aspect_ratio,
            height: backdrop.height,
            width: backdrop.width,
            file_path: URLs.image + backdrop.file_path,
        })) || []; // Fallback to an empty array

        const postersArray = fetchedImagesData.posters?.slice(0, 30).map(poster => ({
            aspect_ratio: poster.aspect_ratio,
            height: poster.height,
            width: poster.width,
            file_path: URLs.image + poster.file_path,
        })) || []; // Fallback to an empty array

        logger.info(`Successfully fetched images for TV show ID: "${tvId}" at ${new Date().toISOString()}`);
        
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