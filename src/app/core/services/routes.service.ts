import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  CreateRouteRequest,
  RouteStatus,
  TransitRoute,
  UpdateRouteRequest,
} from '../models/route.model';
import { QueryParams } from '../models/query-params.model';

@Injectable({
  providedIn: 'root',
})
export class RoutesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/routes`;

  getRoutes(params?: QueryParams): Observable<ApiResponse<TransitRoute[]>> {
    return this.http.get<ApiResponse<TransitRoute[]>>(this.apiUrl, {
      params: this.buildParams(params),
    });
  }

  getRouteById(id: string): Observable<ApiResponse<TransitRoute>> {
    return this.http.get<ApiResponse<TransitRoute>>(`${this.apiUrl}/${id}`);
  }

  createRoute(payload: CreateRouteRequest): Observable<ApiResponse<TransitRoute>> {
    return this.http.post<ApiResponse<TransitRoute>>(this.apiUrl, payload);
  }

  updateRoute(id: string, payload: UpdateRouteRequest): Observable<ApiResponse<TransitRoute>> {
    return this.http.patch<ApiResponse<TransitRoute>>(`${this.apiUrl}/${id}`, payload);
  }

  updateRouteStatus(id: string, status: RouteStatus): Observable<ApiResponse<TransitRoute>> {
    return this.http.patch<ApiResponse<TransitRoute>>(`${this.apiUrl}/${id}/status`, {
      status,
    });
  }

  deleteRoute(id: string): Observable<ApiResponse<null>> {
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
