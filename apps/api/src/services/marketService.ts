import { redis } from '../config/redis';
import { env } from '../config/env';
import { MarketSnapshot } from '../types';

const CACHE_TTL_SECONDS = 60; // 1 minute cache — Polygon free tier is end-of-day, but still cache it

export const getMarketSnapshot = async (ticker: string): Promise<MarketSnapshot | null> => {
  const cacheKey = `market:${ticker.toUpperCase()}`;

  // Check Redis cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${ticker}`);
      return JSON.parse(cached);
    }
  } catch {
    // Redis miss or error — continue to API
  }

  // Fetch from Polygon.io
  try {
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker.toUpperCase()}/prev?adjusted=true&apiKey=${env.POLYGON_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json() as { status: string; results?: Array<{ c: number; o: number; v: number }> };

    if (data.status !== 'OK' || !data.results?.length) {
      return null;
    }

    const result = data.results[0];
    const snapshot: MarketSnapshot = {
      ticker: ticker.toUpperCase(),
      price: result.c,           // close price
      changePercent: ((result.c - result.o) / result.o) * 100,
      volume: result.v,
      fetchedAt: new Date().toISOString(),
    };

    // Cache it
    await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(snapshot));

    return snapshot;
  } catch (err) {
    console.error(`Market data fetch failed for ${ticker}:`, err);
    return null;
  }
};
