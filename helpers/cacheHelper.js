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

            // 🔥 Fix: Parse 'messages' if it's a string
            if (typeof data.data.messages === "string") {
                try {
                    data.data.messages = JSON.parse(data.data.messages);
                } catch (error) {
                    console.error("Error parsing messages:", error);
                    return null;
                }
            }

            return data;
        }).filter(req => req); // Remove null/undefined entries

        console.log("All Requests:", JSON.stringify(allRequests, null, 2));

        // 🔍 Filter by mobile number if provided
        let filteredRequests = allRequests;
        if (mobileNumber) {
            filteredRequests = filteredRequests.filter(req => {
                console.log("going to chech if arrat Req Data:", req.data);
                if (Array.isArray(req.data.messages)) {
                    console.log("it is array of number");
                    return req.data.messages.some(msg => {
                        console.log("msg.number:", msg.number);
                        console.log("mobileNumber:", mobileNumber);
                        console.log("mobileNumber==msg.number", mobileNumber == msg.number);
                        return msg.number == mobileNumber
                    });
                }
                return false;
            });
        }

        // 🔍 Limit the count if provided
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
