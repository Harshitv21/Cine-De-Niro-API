import rateLimit from 'express-rate-limit';

// TMDB Rate Limiter (movies and TV shows endpoints) Slightly below TMDB's 50 requests per second limit
export const tmdbLimiter = rateLimit({
    windowMs: 1000, // 1 second window
    max: 36,        // Limit each IP to 36 requests per second
    message: 'Too many requests to TMDB (/movies, /tv endpoints), please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Jikan Rate Limiter (anime endpoints) Slightly below Jikan’s 3 requests per second and 60 requests per minute
export const jikanLimiter = rateLimit({
    windowMs: 1000, // 1 second window
    max: 2,         // Limit each IP to 2 requests per second
    message: 'Too many requests to Jikan (/anime endpoints), please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const jikanMinuteLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 50,             // Limit each IP to 50 requests per minute
    message: 'Too many requests to Jikan, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
