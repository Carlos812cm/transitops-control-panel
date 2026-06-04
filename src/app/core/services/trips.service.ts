import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { CreateTripRequest, Trip, TripStatus, UpdateTripStatusRequest } from '../models/trip.model';
import { QueryParams } from '../models/query-params.model';

@Injectable({
  providedIn: 'root',
})
export class TripsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/trips`;

  getTrips(params?: QueryParams): Observable<ApiResponse<Trip[]>> {
    return this.http.get<ApiResponse<Trip[]>>(this.apiUrl, {
      params: this.buildParams(params),
    });
  }

  getTripById(id: string): Observable<ApiResponse<Trip>> {
    return this.http.get<ApiResponse<Trip>>(`${this.apiUrl}/${id}`);
  }

  createTrip(payload: CreateTripRequest): Observable<ApiResponse<Trip>> {
    return this.http.post<ApiResponse<Trip>>(this.apiUrl, payload);
  }

  updateTripStatus(id: string, status: TripStatus): Observable<ApiResponse<Trip>> {
    const payload: UpdateTripStatusRequest = {
      status,
    };

    return this.http.patch<ApiResponse<Trip>>(`${this.apiUrl}/${id}/status`, payload);
  }

  deleteTrip(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  private buildParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();

    if (!params) {
      return httpParams;
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }
}
