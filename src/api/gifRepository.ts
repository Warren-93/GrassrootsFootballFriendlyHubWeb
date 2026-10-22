import { apiClient } from './client';
import type { GifView } from './types';

/**
 * GIF search for the chat's GIF picker. Goes through the API, which holds the
 * GIPHY key and only returns GIFs at the configured safe rating.
 */
export const gifRepository = {
  trending: (limit = 24) => apiClient.get<{ results: GifView[] }>('/api/v1/gifs/trending', { limit }),
  search: (q: string, limit = 24) => apiClient.get<{ results: GifView[] }>('/api/v1/gifs/search', { q, limit }),
};
