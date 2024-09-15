const redis = require('redis');
const logger = require("logat");
// Initialize the Redis client
const client = redis.createClient();

client.on('error', (err) => {
    console.error('Redis Client Error', err);
});

// Connect to the Redis server
(async () => {
    await client.connect();
    logger.info(`INFO || Redis Connected`);
})();

/**
 * Checks if a given key exists in the Redis cache.
 * @param {string} key - The cache key to check.
 * @returns {Promise<string | null>} - Returns the cached value if found, otherwise null.
 */
const checkApiInCache = async (key) => {
    try {
        const value = await client.get(key);
        return value;
    } catch (err) {
        logger.error(`Error || Error checking cache`);
        return null;
    }
};

/**
 * Saves a key-value pair in the Redis cache with an optional TTL (time to live).
 * @param {string} key - The cache key to save.
 * @param {string} value - The value to store in the cache.
 * @param {number} [ttl=180] - The time to live in seconds (default is 180 seconds).
 * @returns {Promise<void>}
 */
const saveApiInCache = async (key, value, ttl = 180) => {
    try {
        await client.set(key, value, { EX: ttl });
    } catch (err) {
        logger.error(`Error || Error in storing into cache`);
        logger.error(err);
    }
};

module.exports = {
    checkApiInCache,
    saveApiInCache
};
