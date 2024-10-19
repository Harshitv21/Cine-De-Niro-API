# Anime & Movie API

![Cloud](https://custom-icon-badges.demolab.com/badge/Deployment-AWS%20Elastic%20Beanstalk-orange?style=for-the-badge&logo=aws&logoColor=white) ![Cloud](https://custom-icon-badges.demolab.com/badge/Deployment-Railway.app-purple?style=for-the-badge&logo=railway&logoColor=white) ![API](https://custom-icon-badges.demolab.com/badge/API-Node%20+%20Express.js-green?style=for-the-badge&logo=express&logoColor=white) ![Logging](https://custom-icon-badges.demolab.com/badge/Logging-Winston-yellow?style=for-the-badge&logo=winston&logoColor=white) ![API](https://custom-icon-badges.demolab.com/badge/API-Jikan%20API-grey?style=for-the-badge&logo=api&logoColor=white) ![API](https://custom-icon-badges.demolab.com/badge/API-TMDB%20API-maroon?style=for-the-badge&logo=api&logoColor=white) ![Caching](https://custom-icon-badges.demolab.com/badge/Caching-Redis-red?style=for-the-badge&logo=redis&logoColor=white) ![CI / CD](https://custom-icon-badges.demolab.com/badge/CI%20/%20CD-Github%20Actions-black?style=for-the-badge&logo=github&logoColor=white)

A comprehensive API that provides access to trending, popular, and upcoming anime, movies, and TV shows. This API leverages the **Jikan API** for anime data and the **TMDB API** for movie & TV show data.

## Features

- **Anime Endpoints**: Fetch trending, popular, and upcoming anime.
- **Movies Endpoints**: Fetch trending, popular, and upcoming movies.
- **TV Shows Endpoints**: Fetch trending and popular TV shows.
- **Search Functionality**: Search across movies, TV shows, and anime with advanced query filtering.
- **Caching**: Implemented with Redis for efficient data retrieval.
- **Rate Limiting**: Protects the API from abuse with rate limiting for Jikan and TMDB endpoints.
- **Deployed on AWS and Railway**: Can be easily deployed on AWS Elastic Beanstalk or Railway.
- **Postman Documentation**: [Postman Collection Link](https://documenter.getpostman.com/view/23414253/2sAXxWb9eu)

## API Endpoints

### Anime Endpoints (Using Jikan API)

- `GET /trending/anime`: Fetch trending anime.
- `GET /popular/anime`: Fetch popular anime.
- `GET /upcoming/anime`: Fetch upcoming anime.
- `GET /search/anime`: Search anime based on various filters.

### Movie Endpoints (Using TMDB API)

- `GET /trending/movies`: Fetch trending movies.
- `GET /popular/movies`: Fetch popular movies.
- `GET /upcoming/movies`: Fetch upcoming movies.
- `GET /search/movies`: Search for movies.

### TV Shows Endpoints (Using TMDB API)

- `GET /trending/tv`: Fetch trending TV shows.
- `GET /popular/tv`: Fetch popular TV shows.
- `GET /search/tv`: Search TV shows based on various filters.

### Image Endpoints

- `GET /images/movie/:id`: Fetch movie images (backdrops and posters).
- `GET /images/tv/:id`: Fetch TV show images (backdrops and posters).

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- Docker (for running Redis locally)
- Redis CLI (for managing Redis, if needed)

### TMDB API Key Setup

To use the movie and TV show endpoints, you'll need to generate a TMDB API key.

1. Visit [TMDB](https://www.themoviedb.org/settings/api) to generate your API key.
2. Store the API key in your environment variables:  

```bash
AUTH_TOKEN=<your_tmdb_api_key>
```

### Running Locally

1. **Clone the repository**

```bash
git clone https://github.com/Harshitv21/Anime-Movie-API.git
cd Anime-Movie-API
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory with the following values (for local setup only):

```bash
AUTH_TOKEN=<your_tmdb_api_key>
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=<in_case_using_redis_cloud>
```

4. **Run Redis in Docker**

**_Much_** clear instructions on installation [here](https://redis.io/docs/latest/operate/oss_and_stack/install/install-stack/docker/)

Exposing docker port to `localhost:8001`,

```bash
docker run -d -p 6379:8001 redis
```

1. **Start the server**

```bash
npm start
```

6. **Test the API locally** by accessing `http://localhost:3000`.

### Setting up Redis on cloud

You can either setup the Redis server through Docker (as shown above) or use Redis cloud if you want to deploy it for yourself more on that [here](https://cloud.redis.io/#/databases).
After creating a Database use the credentials in `middlewares/rateLimiter.js` + `.env` file and Redis on cloud is ready for your deployment!

## Deployment

### AWS Elastic Beanstalk

> You may need to create an AWS account and enter your card details (In case one doesn't exists already 😛) Which _might_ cost you some money (it costed me around a dollar or something for a month) so proceed with this step carefully!

To deploy this project on AWS Elastic Beanstalk, follow these steps:

1. **Install Elastic Beanstalk CLI**

```bash
pip install awsebcli
```

2. **Initialize Elastic Beanstalk**

```bash
eb init
```

> Go through the configuration

3. **Create an environment and deploy**

 ```bash
eb create
eb deploy
```

4. **Environment Variables on AWS**:  
   After deploying, go to AWS Elastic Beanstalk dashboard and add the necessary environment variables like `AUTH_TOKEN`, `REDIS_HOST`, and `REDIS_PORT` (optionally `REDIS_PASSWORD`).

### Railway Deployment

The project is also deployable on Railway:

1. **Fork the repository** and link your Railway account to GitHub.
2. **Add environment variables** in Railway under the project settings and then copy the content of your `.env` file in variables section.
3. **Deploy**: The app should automatically deploy on pushes to the main branch.

## Rate Limiting

To avoid abuse, rate limiting has been implemented for both Jikan and TMDB endpoints:

- **Jikan API**: Limit is set to 50 requests/minute and 2 requests/second.
- **TMDB API**: Limit is set to 36 requests/second.

## Caching with Redis

The API uses Redis to cache popular, trending, and search results to improve performance and reduce API calls.

- Caches the results for 1 hour (`EX 3600`).

## Postman Documentation

You can explore and interact with the API using the Postman collection which provides a much comprehensive documentation:
[Postman Collection Link](https://documenter.getpostman.com/view/23414253/2sAXxWb9eu)

## Contributing

Feel free to contribute to this project by opening an issue or submitting a pull request. All contributions are welcome!

## Contact

If you have any questions, feel free to reach out:

- **Author**: Harshit Kumar Verma
- **GitHub**: [Harshitv21](https://github.com/Harshitv21)
- **LinkedIn**: [harshitkverma](https://www.linkedin.com/in/harshitkverma/)

---
