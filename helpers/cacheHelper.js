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
        const keys = this.cache.keys();
        console.log("Cache Keys:", keys);

        const allRequests = keys.map(key => {
            const data = this.cache.get(key);
            console.log(`Key: ${key}, Data:`, JSON.stringify(data, null, 2));
            return data;
        }).filter(req => req); // Remove null/undefined entries

        console.log("All Requests:", JSON.stringify(allRequests, null, 2));

        // 🔥 Fix: Extract numbers from `messages` array
        let filteredRequests = allRequests;
        if (mobileNumber) {
            filteredRequests = filteredRequests.filter(req => {
                if (req.data.messages && req.data.messages.length > 0) {
                    return req.data.messages.some(msg => msg.number === mobileNumber);
                }
                return false;
            });
        }

        // Limit the count if provided
        if (count) {
            filteredRequests = filteredRequests.slice(-count);
        }

        console.log("Filtered Requests:", JSON.stringify(filteredRequests, null, 2));
        return filteredRequests;
    }



    // Flush all cached data
    flushCache() {
        this.cache.flushAll();
    }
}

module.exports = new CacheHelper();
