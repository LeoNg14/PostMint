import Groq from 'groq-sdk';
import { env } from './env';

export const groq = new Groq({ apiKey: env.GROQ_API_KEY });

// Model to use — fast, high quality, great for structured text generation
export const GROQ_MODEL = 'llama-3.3-70b-versatile';
