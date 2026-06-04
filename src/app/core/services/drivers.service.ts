import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  CreateDriverRequest,
  Driver,
  DriverStatus,
  UpdateDriverRequest,
} from '../models/driver.model';
import { QueryParams } from '../models/query-params.model';

@Injectable({
  providedIn: 'root',
})
export class DriversService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/drivers`;

  getDrivers(params?: QueryParams): Observable<ApiResponse<Driver[]>> {
    return this.http.get<ApiResponse<Driver[]>>(this.apiUrl, {
      params: this.buildParams(params),
    });
  }

  getDriverById(id: string): Observable<ApiResponse<Driver>> {
    return this.http.get<ApiResponse<Driver>>(`${this.apiUrl}/${id}`);
  }

  createDriver(payload: CreateDriverRequest): Observable<ApiResponse<Driver>> {
    return this.http.post<ApiResponse<Driver>>(this.apiUrl, payload);
  }

  updateDriver(id: string, payload: UpdateDriverRequest): Observable<ApiResponse<Driver>> {
    return this.http.patch<ApiResponse<Driver>>(`${this.apiUrl}/${id}`, payload);
  }

  updateDriverStatus(id: string, status: DriverStatus): Observable<ApiResponse<Driver>> {
    return this.http.patch<ApiResponse<Driver>>(`${this.apiUrl}/${id}/status`, {
      status,
    });
  }

  deleteDriver(id: string): Observable<ApiResponse<null>> {
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
