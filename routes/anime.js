/*
 █████╗ ███╗   ██╗██╗███╗   ███╗███████╗    ██╗   ██╗██╗    ██╗██╗   ██╗
██╔══██╗████╗  ██║██║████╗ ████║██╔════╝    ██║   ██║██║    ██║██║   ██║
███████║██╔██╗ ██║██║██╔████╔██║█████╗      ██║   ██║██║ █╗ ██║██║   ██║
██╔══██║██║╚██╗██║██║██║╚██╔╝██║██╔══╝      ██║   ██║██║███╗██║██║   ██║
██║  ██║██║ ╚████║██║██║ ╚═╝ ██║███████╗    ╚██████╔╝╚███╔███╔╝╚██████╔╝
╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚══════╝     ╚═════╝  ╚══╝╚══╝  ╚═════╝ 
*/

import express from 'express';
import axios from 'axios';
import logger from '../utils/logger.js';
import { URLs } from '../config/constants.js';

const router = express.Router();

/* =============================================== */
/*                  Trending anime                 */
/* =============================================== */
router.get("/trending/anime", async (request, response) => {
    let { page = 1, limit = 25, filter, sfw, unapproved, continuing } = request.query;

    // Define allowed filter values & validate
    const allowedFilters = ["tv", "movie", "ova", "special", "ona", "music"];

    if (filter && !allowedFilters.includes(filter)) {
        return response.status(400).send({ error: `Invalid filter value: "${filter}". Allowed values are: ${allowedFilters.join(", ")}` });
    }

    try {
        let trendingAnimeUrl = `${URLs.jikan}/seasons/now?page=${page}&limit=${limit}`;

        // Add filters if provided
        if (filter) {
            trendingAnimeUrl += `&filter=${filter}`;
        }
        if (sfw) {
            trendingAnimeUrl += `&sfw`;
        }
        if (unapproved) {
            trendingAnimeUrl += `&unapproved`;
        }
        if (continuing) {
            trendingAnimeUrl += `&continuing`;
        }

        const trending = await axios.get(trendingAnimeUrl);
        const trendingAnimeData = trending.data;

        // Check if the requested page exceeds the last visible page
        if (page > trendingAnimeData.pagination.last_visible_page) {
            return response.status(404).json({
                pagination: {
                    current_page: page,
                    last_visible_page: trendingAnimeData.pagination.last_visible_page,
                    has_next_page: false,
                    items: {
                        count: 0,
                        total: 0,
                        per_page: limit
                    }
                },
                results: [],
                message: "No results found for the requested page."
            });
        }

        const trendingAnimeArray = trendingAnimeData.data.slice(0, limit).map(anime => ({
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

        const paginationInfo = {
            current_page: page,
            last_visible_page: trendingAnimeData.pagination.last_visible_page,
            has_next_page: trendingAnimeData.pagination.has_next_page,
            items: {
                count: trendingAnimeData.pagination.items.count,
                total: trendingAnimeData.pagination.items.total,
                per_page: limit
            }
        };

        const responseData = {
            pagination: paginationInfo,
            results: trendingAnimeArray
        };

        logger.info(`Fetched trending anime with query params: page=${page}, limit=${limit}, filter=${filter}, at ${new Date().toISOString()}`);
        response.send(responseData);
    } catch (err) {
        handleError(err, response);
    }
});

/* =============================================== */
/*                  Popular anime                  */
/* =============================================== */
router.get("/popular/anime", async (request, response) => {
    let { page = 1, limit = 25, type, filter, rating, sfw } = request.query;

    // Define allowed filter values & validate
    const allowedFilters = ["airing", "upcoming", "bypopularity", "favorite"];
    const allowedTypes = ["tv", "movie", "ova", "special", "ona", "music", "cm", "pv", "tv_special"];

    if (filter && !allowedFilters.includes(filter)) {
        return response.status(400).send({ error: `Invalid filter value: "${filter}". Allowed values are: ${allowedFilters.join(", ")}` });
    }

    if (type && !allowedTypes.includes(type)) {
        return response.status(400).send({ error: `Invalid type value: "${type}". Allowed values are: ${allowedTypes.join(", ")}` });
    }

    try {
        let popularAnimeUrl = `${URLs.jikan}/top/anime?page=${page}&limit=${limit}`;

        // add filters if provided
        if (type) {
            popularAnimeUrl += `&type=${type}`;
        }
        if (filter) {
            popularAnimeUrl += `&filter=${filter}`;
        }
        if (rating) {
            popularAnimeUrl += `&rating=${rating}`;
        }
        if (sfw) {
            popularAnimeUrl += `&sfw`;
        }

        const popular = await axios.get(popularAnimeUrl);
        const popularAnimeData = popular.data;

        // Check if the requested page exceeds the last visible page
        if (page > popularAnimeData.pagination.last_visible_page) {
            return response.status(404).json({
                pagination: {
                    current_page: page,
                    last_visible_page: popularAnimeData.pagination.last_visible_page,
                    has_next_page: false,
                    items: {
                        count: 0,
                        total: 0,
                        per_page: limit
                    }
                },
                results: [],
                message: "No results found for the requested page."
            });
        }

        const popularAnimeArray = popularAnimeData.data.slice(0, limit).map(anime => ({
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

        const paginationInfo = {
            current_page: page,
            last_visible_page: popularAnimeData.pagination.last_visible_page,
            has_next_page: popularAnimeData.pagination.has_next_page,
            items: {
                count: popularAnimeData.pagination.items.count,
                total: popularAnimeData.pagination.items.total,
                per_page: limit
            }
        };

        const responseData = {
            pagination: paginationInfo,
            results: popularAnimeArray
        };

        logger.info(`Fetched popular anime with query params: page=${page}, limit=${limit}, filter=${filter}, at ${new Date().toISOString()}`);
        response.send(responseData);
    } catch (err) {
        handleError(err, response);
    }
});

/* =============================================== */
/*                  Upcoming anime                 */
/* =============================================== */
router.get("/upcoming/anime", async (request, response) => {
    let { page = 1, limit = 25, filter, sfw, unapproved, continuing } = request.query;

    // Define allowed filter values & validate
    const allowedFilters = ["tv", "movie", "ova", "special", "ona", "music"];

    if (filter && !allowedFilters.includes(filter)) {
        return response.status(400).send({ error: `Invalid filter value: "${filter}". Allowed values are: ${allowedFilters.join(", ")}` });
    }

    try {
        const upcomingAnimeUrl = `${URLs.jikan}/seasons/upcoming?page=${page}&limit=${limit}`;

        // Add filters if provided
        if (filter) {
            upcomingAnimeUrl += `&filter=${filter}`;
        }
        if (sfw) {
            upcomingAnimeUrl += `&sfw`;
        }
        if (unapproved) {
            upcomingAnimeUrl += `&unapproved`;
        }
        if (continuing) {
            upcomingAnimeUrl += `&continuing`;
        }

        const upcoming = await axios.get(upcomingAnimeUrl);
        const upcomingAnimeData = upcoming.data;

        // Check if the requested page exceeds the last visible page
        if (page > upcomingAnimeData.pagination.last_visible_page) {
            return response.status(404).json({
                pagination: {
                    current_page: page,
                    last_visible_page: upcomingAnimeData.pagination.last_visible_page,
                    has_next_page: false,
                    items: {
                        count: 0,
                        total: 0,
                        per_page: limit
                    }
                },
                results: [],
                message: "No results found for the requested page."
            });
        }

        const upcomingAnimeArray = upcomingAnimeData.data.slice(0, limit).map(anime => ({
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

        const paginationInfo = {
            current_page: page,
            last_visible_page: upcomingAnimeData.pagination.last_visible_page,
            has_next_page: upcomingAnimeData.pagination.has_next_page,
            items: {
                count: upcomingAnimeData.pagination.items.count,
                total: upcomingAnimeData.pagination.items.total,
                per_page: limit
            }
        };

        const responseData = {
            pagination: paginationInfo,
            results: upcomingAnimeArray
        };

        logger.info(`Fetched upcoming anime with query params: page=${page}, limit=${limit}, filter=${filter}, at ${new Date().toISOString()}`);
        response.send(responseData);
    } catch (err) {
        handleError(err, response);
    }
});

/* ================================================== */
/*                 Search anime by id                 */
/* ================================================== */
router.get("/search/anime/:id", async (request, response) => {
    const animeId = request.params.id;

    // adding a delay
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    try {
        const fetchAnime = async () => {
            await delay(0); // No delay 
            return axios.get(`${URLs.jikan}/anime/${animeId}`);
        };

        const fetchImages = async () => {
            await delay(1000); // 1 second delay 
            return axios.get(`${URLs.jikan}/anime/${animeId}/pictures`);
        };

        const fetchVideos = async () => {
            await delay(2000); // 2 seconds delay 
            return axios.get(`${URLs.jikan}/anime/${animeId}/videos`);
        };

        const [animeResult, imagesResult, videosResult] = await Promise.allSettled([
            fetchAnime(),
            fetchImages(),
            fetchVideos()
        ]);

        // Handling anime data
        let searchAnimeData = animeResult.status === 'fulfilled' ? animeResult.value.data : { isFetched: false, error: "Can't fetch anime data" };

        // Handling images data
        let imagesData = imagesResult.status === 'fulfilled'
            ? imagesResult.value.data.data
            : { isFetched: false, error: "Can't fetch images" };

        // Organize images only if fetched successfully
        const organizedImages = imagesResult.status === 'fulfilled'
            ? {
                isFetched: true,
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
            }
            : imagesData;

        // Handling videos data
        let videosData = videosResult.status === 'fulfilled'
            ? { isFetched: true, data: videosResult.value.data.data }
            : { isFetched: false, error: "Can't fetch videos" };

        searchAnimeData.images_data = organizedImages;
        searchAnimeData.videos = videosData;

        logger.info(`Successfully fetched anime for ID "${animeId}" at ${new Date().toISOString()}`);
        response.send(searchAnimeData);
    } catch (err) {
        handleError(err, response);
    }
});

/* ===================================================== */
/*                 Search anime by query                 */
/* ===================================================== */
router.get("/search/anime", async (request, response) => {
    let {
        page = 1,
        limit = 25,
        q,
        type,
        score,
        min_score,
        max_score,
        status,
        rating,
        sfw,
        genres,
        genres_exclude,
        order_by,
        sort = "desc",
        letter,
        producers,
        start_date,
        end_date,
        unapproved
    } = request.query;

    // Allowed Enums for validation
    const allowedTypes = ["tv", "movie", "ova", "special", "ona", "music", "cm", "pv", "tv_special"];
    const allowedStatuses = ["airing", "complete", "upcoming"];
    const allowedRatings = ["g", "pg", "pg13", "r17", "r", "rx"];
    const allowedOrderBy = ["mal_id", "title", "start_date", "end_date", "episodes", "score", "scored_by", "rank", "popularity", "members", "favorites"];
    const allowedSortDirections = ["desc", "asc"];

    // Validation (only if the query parameters are provided)
    if (type && !allowedTypes.includes(type)) {
        return response.status(400).send({ error: `Invalid type value: "${type}". Allowed values are: ${allowedTypes.join(", ")}` });
    }

    if (status && !allowedStatuses.includes(status)) {
        return response.status(400).send({ error: `Invalid status value: "${status}". Allowed values are: ${allowedStatuses.join(", ")}` });
    }

    if (rating && !allowedRatings.includes(rating)) {
        return response.status(400).send({ error: `Invalid rating value: "${rating}". Allowed values are: ${allowedRatings.join(", ")}` });
    }

    if (order_by && !allowedOrderBy.includes(order_by)) {
        return response.status(400).send({ error: `Invalid order_by value: "${order_by}". Allowed values are: ${allowedOrderBy.join(", ")}` });
    }

    if (sort && !allowedSortDirections.includes(sort)) {
        return response.status(400).send({ error: `Invalid sort value: "${sort}". Allowed values are: ${allowedSortDirections.join(", ")}` });
    }

    // Build query string dynamically, including only provided parameters
    const queryParams = new URLSearchParams();

    queryParams.set('page', page);
    queryParams.set('limit', limit);

    if (q) queryParams.set('q', q);
    if (type) queryParams.set('type', type);
    if (score) queryParams.set('score', score);
    if (min_score) queryParams.set('min_score', min_score);
    if (max_score) queryParams.set('max_score', max_score);
    if (status) queryParams.set('status', status);
    if (rating) queryParams.set('rating', rating);
    if (sfw) queryParams.set('sfw', 'true');
    if (genres) queryParams.set('genres', genres);
    if (genres_exclude) queryParams.set('genres_exclude', genres_exclude);
    if (order_by) queryParams.set('order_by', order_by);
    if (sort) queryParams.set('sort', sort);
    if (letter) queryParams.set('letter', letter);
    if (producers) queryParams.set('producers', producers);
    if (start_date) queryParams.set('start_date', start_date);
    if (end_date) queryParams.set('end_date', end_date);
    if (unapproved) queryParams.set('unapproved', 'true');

    try {
        const searchAnimeUrl = `${URLs.jikan}/anime?${queryParams.toString()}`;
        const searchAnime = await axios.get(searchAnimeUrl);
        const searchAnimeData = searchAnime.data;

        // Check if the requested page exceeds the last visible page
        if (page > searchAnimeData.pagination.last_visible_page) {
            return response.status(404).json({
                pagination: {
                    current_page: page,
                    last_visible_page: searchAnimeData.pagination.last_visible_page,
                    has_next_page: false,
                    items: {
                        count: 0,
                        total: 0,
                        per_page: limit
                    }
                },
                results: [],
                message: "No results found for the requested page."
            });
        }

        logger.info(`Fetched searched anime, at ${new Date().toISOString()}`);
        response.send(searchAnimeData);
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
