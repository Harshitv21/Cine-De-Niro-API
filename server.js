import express from "express";
import axios from "axios";
import dotenv from 'dotenv';
import cors from "cors";
import path from "path";             // Import path module to resolve file paths
import { fileURLToPath } from 'url'; // Needed to resolve file path with ES modules

dotenv.config();

const app = express();

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

const PORT = process.env.PORT || 3000;

/* =============================================== */
/*                  BASE URLS                      */
/* =============================================== */
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
        const url = "https://api.themoviedb.org/3/trending/movie/week?language=en-US";

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

        response.send(trendingMovieArray);
    } catch (err) {
        console.error("Error fetching trending movies:", err);
        response.status(500).send("Error fetching trending movies.");
    }
});

/* =============================================== */
/*                  Popular movies                 */
/* =============================================== */
app.get("/popular/movies", async (request, response) => {
    try {
        const url = "https://api.themoviedb.org/3/movie/popular?language=en-US&page=1";

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

        response.send(popularMovieArray);
    } catch (err) {
        console.error("Error fetching popular movies:", err);
        response.status(500).send("Error fetching popular movies.");
    }
});

/* =============================================== */
/*                  Upcoming movies                */
/* =============================================== */
app.get("/upcoming/movies", async (request, response) => {
    try {
        const url = "https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=1";

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

        response.send(upcomingMovieArray);
    } catch (err) {
        console.error("Error fetching upcoming movies:", err);
        response.status(500).send("Error fetching upcoming movies.");
    }
});

/* =============================================== */
/*                  Trending TV                    */
/* =============================================== */
app.get("/trending/tv", async (request, response) => {
    try {
        const url = "https://api.themoviedb.org/3/trending/tv/week?language=en-US";

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

        response.send(trendingTVArray);
    } catch (err) {
        console.error("Error fetching trending tv:", err);
        response.status(500).send("Error fetching trending tv.");
    }
});

/* =============================================== */
/*                  Popular TV                     */
/* =============================================== */
app.get("/popular/tv", async (request, response) => {
    try {
        const url = "https://api.themoviedb.org/3/tv/top_rated?language=en-US&page=1";

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

        response.send(popularTVArray);
    } catch (err) {
        console.error("Error fetching trending tv:", err);
        response.status(500).send("Error fetching trending tv.");
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

        response.send(trendingAnimeArray);
    } catch (err) {
        console.error("Error fetching trending anime:", err);
        response.status(500).send("Error fetching trending anime.");
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

        response.send(popularAnimeArray);
    } catch (err) {
        console.error("Error fetching popular anime:", err);
        response.status(500).send("Error fetching popular anime.");
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

        response.send(upcomingAnimeArray);
    } catch (err) {
        console.error("Error fetching popular anime:", err);
        response.status(500).send("Error fetching popular anime.");
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
    console.log(`Listening on port ${PORT}`);
});
