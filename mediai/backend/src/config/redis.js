import { createClient } from 'redis';

let redisClient;

const useMockRedis = () => {
  console.log('🔄 Using in-memory mock Redis client.');
  const store = {};
  return {
    get: async (key) => store[key] || null,
    set: async (key, val, options) => {
      store[key] = val;
      return 'OK';
    },
    del: async (key) => {
      delete store[key];
      return 1;
    },
    connect: async () => {},
    on: () => {},
    disconnect: async () => {}
  };
};

if (process.env.REDIS_URL) {
  try {
    // Disable auto-reconnect strategy to throw connection errors immediately
    const tempClient = createClient({ 
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: () => false // Do not retry connection
      }
    });
    
    tempClient.on('error', (err) => {
      // Catch socket errors silently since we handle them in the connect catch block
    });

    await tempClient.connect();
    console.log('✅ Connected to Redis successfully.');
    redisClient = tempClient;
  } catch (err) {
    console.warn('⚠️ Redis connection failed. Falling back to mock client.', err.message);
    redisClient = useMockRedis();
  }
} else {
  redisClient = useMockRedis();
}

export default redisClient;
