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

        logger.info(`Successfully fetched trending animes at ${new Date().toISOString()}`);
        response.send(responseData);
    } catch (err) {
        handleError(err, response);
    }
});

/* =============================================== */
/*                  Popular anime                  */
/* =============================================== */
router.get("/popular/anime", async (request, response) => {
    try {
        const popularAnimeUrl = `${URLs.jikan}/top/anime`;
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
        handleError(err, response);
    }
});

/* =============================================== */
/*                  Upcoming anime                 */
/* =============================================== */
router.get("/upcoming/anime", async (request, response) => {
    try {
        const upcomingAnimeUrl = `${URLs.jikan}/seasons/upcoming`;
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
    const queryParams = request.query;
    // constructing the query string
    const queryString = new URLSearchParams(queryParams).toString();
    try {
        const searchAnimeUrl = queryString
            ? `${URLs.jikan}/anime?${queryString}`
            : `${URLs.jikan}/anime`;
        const searchAnime = await axios.get(searchAnimeUrl);
        const searchAnimeData = searchAnime.data;

        logger.info(`Successfully fetched anime for query(s) "${queryParams}" at ${new Date().toISOString()}`);
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
