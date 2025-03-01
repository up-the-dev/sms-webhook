const NodeCache = require("node-cache");

class CacheHelper {
    constructor(ttlSeconds = 300) { // 300 seconds = 5 minutes
        this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: ttlSeconds * 0.2, useClones: false });
    }

    // Add request to cache with a unique ID (timestamp-based key)
    addRequest(request) {
        const requestId = `req_${Date.now()}`; // Unique key for each request
        this.cache.set(requestId, request);
    }

    // Get requests based on filters (mobileNumber & count)
    getRequests({ mobileNumber, count }) {
        const allRequests = this.cache.keys().map(key => this.cache.get(key)).filter(req => req); // Fetch all valid requests

        // Filter by mobile number if provided
        let filteredRequests = allRequests;
        if (mobileNumber) {
            filteredRequests = filteredRequests.filter(req => req.data.number === mobileNumber);
        }

        // Limit the count if provided
        if (count) {
            filteredRequests = filteredRequests.slice(-count); // Get latest 'count' records
        }

        return filteredRequests;
    }

    // Flush all cached data
    flushCache() {
        this.cache.flushAll();
    }
}

module.exports = new CacheHelper();
