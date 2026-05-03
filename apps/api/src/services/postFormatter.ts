import { Platform, GeneratedPost } from '../types';

const PLATFORM_CHAR_LIMITS: Record<Platform, number> = {
  twitter: 280,
  linkedin: 3000,
  tiktok: 2200,
  newsletter: 100000,
};

const extractHashtags = (content: string): string[] => {
  const matches = content.match(/#[\w]+/g) ?? [];
  return matches.map(tag => tag.toLowerCase());
};

const enforceCharLimit = (content: string, platform: Platform): string => {
  const limit = PLATFORM_CHAR_LIMITS[platform];
  if (content.length <= limit) return content;

  // Trim at last complete word before limit
  const trimmed = content.slice(0, limit);
  const lastSpace = trimmed.lastIndexOf(' ');
  return lastSpace > 0 ? trimmed.slice(0, lastSpace) + '...' : trimmed;
};

export const formatPost = (rawContent: string, platform: Platform): GeneratedPost => {
  const cleaned = rawContent.trim();
  const enforced = enforceCharLimit(cleaned, platform);
  const hashtags = extractHashtags(enforced);

  return {
    platform,
    content: enforced,
    characterCount: enforced.length,
    hashtags,
  };
};
