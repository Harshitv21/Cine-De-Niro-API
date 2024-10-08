import express from "express";
import axios from "axios";
import dotenv from 'dotenv';
import cors from "cors";
import path from "path";             // Import path module to resolve file paths
import { fileURLToPath } from 'url'; // Needed to resolve file path with ES modules

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

const imageUrl = "https://image.tmdb.org/t/p/w500";
const baseJikanUrl = "https://api.jikan.moe/v4";

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
/* *********************************************** */
// Serve index.html on the root route
app.get("/", (request, response) => {
    response.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =============================================== */
/*                  TMDB API ROUTES                */
/* =============================================== */
/* *********************************************** */

/* =============================================== */
/*                  Trending movies                */
/* =============================================== */
app.get("/trending-movies", async (request, response) => {
    try {
        const url = "https://api.themoviedb.org/3/trending/movie/week?language=en-US";

        const trending = await axios.get(url, options);
        const trendingData = trending.data.results;

        const trendingMovieArray = trendingData.slice(0, 20).map(movie => ({
            id: movie.id,
            title: movie.title,
            backdrop_path: imageUrl + movie.backdrop_path,
            overview: movie.overview
        }));

        response.send(trendingMovieArray);
    } catch (err) {
        console.error("Error fetching trending movies:", err);
        response.status(500).send("Error fetching trending movies.");
    }
});

/* =============================================== */
/*                  Trending TV                    */
/* =============================================== */
app.get("/trending-tv", async (request, response) => {
    try {
        const url = "https://api.themoviedb.org/3/trending/tv/week?language=en-US";

        const trending = await axios.get(url, options);
        const trendingData = trending.data.results;

        const trendingTVArray = trendingData.slice(0, 20).map(movie => ({
            id: movie.id,
            title: movie.name,
            backdrop_path: imageUrl + movie.backdrop_path,
            overview: movie.overview
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
app.get("/popular-tv", async (request, response) => {
    try {
        const url = "https://api.themoviedb.org/3/tv/top_rated?language=en-US&page=1";

        const popular = await axios.get(url, options);
        const popularData = popular.data.results;

        const popularTVArray = popularData.slice(0, 20).map(movie => ({
            id: movie.id,
            title: movie.name,
            backdrop_path: imageUrl + movie.backdrop_path,
            overview: movie.overview
        }));

        response.send(popularTVArray);
    } catch (err) {
        console.error("Error fetching trending tv:", err);
        response.status(500).send("Error fetching trending tv.");
    }
});

/* =============================================== */
/*                  Popular movies                 */
/* =============================================== */
app.get("/popular-movies", async (request, response) => {
    try {
        const url = "https://api.themoviedb.org/3/movie/popular?language=en-US&page=1";

        const popular = await axios.get(url, options);
        const popularData = popular.data.results;

        const popularMovieArray = popularData.slice(0, 20).map(movie => ({
            id: movie.id,
            title: movie.title,
            backdrop_path: imageUrl + movie.backdrop_path,
            overview: movie.overview
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
app.get("/upcoming-movies", async (request, response) => {
    try {
        const url = "https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=1";

        const upcoming = await axios.get(url, options);
        const upcomingData = upcoming.data.results;

        const upcomingMovieArray = upcomingData.slice(0, 20).map(movie => ({
            id: movie.id,
            title: movie.title,
            backdrop_path: imageUrl + movie.backdrop_path,
            overview: movie.overview
        }));

        response.send(upcomingMovieArray);
    } catch (err) {
        console.error("Error fetching upcoming movies:", err);
        response.status(500).send("Error fetching upcoming movies.");
    }
});

// app.get("/search-movie", async (request, response) => {
//     const query = request.query.q; // Get the search query from the query parameters
//     console.log(`Searching for movie: ${query}`);
//     // Replace with the actual TMDB API call
//     response.send(`Search results for movie: ${query}`);
// });

// app.get("/search-tv", async (request, response) => {
//     const query = request.query.q; // Get the search query from the query parameters
//     console.log(`Searching for TV show: ${query}`);
//     // Replace with the actual TMDB API call
//     response.send(`Search results for TV show: ${query}`);
// });

/* =============================================== */
/*                  JIKAN API ROUTES               */
/* =============================================== */
/* *********************************************** */

/* =============================================== */
/*                  Trending anime                 */
/* =============================================== */
app.get("/trending-anime", async (request, response) => {
    try {
        const trendingAnimeUrl = `${baseJikanUrl}/seasons/now`;
        const trending = await axios.get(trendingAnimeUrl);
        const trendingAnimeData = trending.data.data;

        const trendingAnimeArray = trendingAnimeData.slice(0, 20).map(anime => ({
            id: anime.mal_id,
            title: anime.titles[0].title,
            image: anime.images.jpg.large_image_url
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
app.get("/popular-anime", async (request, response) => {
    try {
        const popularAnimeUrl = `${baseJikanUrl}/top/anime`;
        const popular = await axios.get(popularAnimeUrl);
        const popularAnimeData = popular.data.data;

        const popularAnimeArray = popularAnimeData.slice(0, 20).map(anime => ({
            id: anime.mal_id,
            title: anime.titles[0].title,
            image: anime.images.jpg.large_image_url
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
app.get("/upcoming-anime", async (request, response) => {
    try {
        const upcomingAnimeUrl = `${baseJikanUrl}/seasons/upcoming`;
        const upcoming = await axios.get(upcomingAnimeUrl);
        const upcomingAnimeData = upcoming.data.data;

        const upcomingAnimeArray = upcomingAnimeData.slice(0, 20).map(anime => ({
            id: anime.mal_id,
            title: anime.titles[0].title,
            image: anime.images.jpg.large_image_url
        }));

        response.send(upcomingAnimeArray);
    } catch (err) {
        console.error("Error fetching popular anime:", err);
        response.status(500).send("Error fetching popular anime.");
    }
});

// app.get("/search-anime", async (request, response) => {
//     const query = request.query.q; // Get the search query from the query parameters
//     console.log(`Searching for anime: ${query}`);
//     response.send(`Search results for anime: ${query}`);
// });

// Start the server
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
