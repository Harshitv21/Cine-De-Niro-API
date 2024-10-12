/*
 ██████╗ ██████╗ ███╗   ██╗███████╗████████╗ █████╗ ███╗   ██╗████████╗███████╗
██╔════╝██╔═══██╗████╗  ██║██╔════╝╚══██╔══╝██╔══██╗████╗  ██║╚══██╔══╝██╔════╝
██║     ██║   ██║██╔██╗ ██║███████╗   ██║   ███████║██╔██╗ ██║   ██║   ███████╗
██║     ██║   ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██║╚██╗██║   ██║   ╚════██║
╚██████╗╚██████╔╝██║ ╚████║███████║   ██║   ██║  ██║██║ ╚████║   ██║   ███████║
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝
*/

import dotenv from 'dotenv';
dotenv.config();

// Not gonna happen but still good error checking
if (!process.env.AUTH_TOKEN) {
    throw new Error("Missing AUTH_TOKEN in environment variables.");
}

/* ====================================== */
/*                  PORT                  */
/* ====================================== */
export const PORT = process.env.PORT || 3000;

/* =============================================== */
/*                  BASE URLS                      */
/* =============================================== */
export const URLs = {
    tmdb: "https://api.themoviedb.org/3",
    image: "https://image.tmdb.org/t/p/w500",
    jikan: "https://api.jikan.moe/v4"
};

/* ============================================================== */
/*                      Options for TMDB API                      */
/* ============================================================== */
export const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`
    }
};
