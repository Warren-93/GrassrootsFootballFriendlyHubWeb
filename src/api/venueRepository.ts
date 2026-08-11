import { apiClient } from './client';
import type { CreateVenueRequest, UpdateVenueRequest, VenueView } from './types';

export const venueRepository = {
  create: (request: CreateVenueRequest) => apiClient.post<VenueView>('/api/v1/venues', request),
  list: (clubId: string) => apiClient.get<VenueView[]>('/api/v1/venues', { clubId }),
  update: (venueId: string, request: UpdateVenueRequest) =>
    apiClient.patch<VenueView>(`/api/v1/venues/${venueId}`, request),
  setDefault: (venueId: string) => apiClient.post<VenueView>(`/api/v1/venues/${venueId}/default`),
  delete: (venueId: string) => apiClient.delete<void>(`/api/v1/venues/${venueId}`),
};
