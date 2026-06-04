import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  Vehicle,
  VehicleStatus,
} from '../models/vehicle.model';
import { QueryParams } from '../models/query-params.model';

@Injectable({
  providedIn: 'root',
})
export class VehiclesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vehicles`;

  getVehicles(params?: QueryParams): Observable<ApiResponse<Vehicle[]>> {
    return this.http.get<ApiResponse<Vehicle[]>>(this.apiUrl, {
      params: this.buildParams(params),
    });
  }

  getVehicleById(id: string): Observable<ApiResponse<Vehicle>> {
    return this.http.get<ApiResponse<Vehicle>>(`${this.apiUrl}/${id}`);
  }

  createVehicle(payload: CreateVehicleRequest): Observable<ApiResponse<Vehicle>> {
    return this.http.post<ApiResponse<Vehicle>>(this.apiUrl, payload);
  }

  updateVehicle(id: string, payload: UpdateVehicleRequest): Observable<ApiResponse<Vehicle>> {
    return this.http.patch<ApiResponse<Vehicle>>(`${this.apiUrl}/${id}`, payload);
  }

  updateVehicleStatus(id: string, status: VehicleStatus): Observable<ApiResponse<Vehicle>> {
    return this.http.patch<ApiResponse<Vehicle>>(`${this.apiUrl}/${id}/status`, {
      status,
    });
  }

  deleteVehicle(id: string): Observable<ApiResponse<null>> {
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
