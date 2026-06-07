import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponseData,
  RequestEmailCodeRequest,
  RequestPhoneCodeRequest,
  User,
  UserRole,
  VerificationCodeResponseData,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'transitops_token';
  private readonly userKey = 'transitops_user';

  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());

  currentUser$ = this.currentUserSubject.asObservable();

  login(payload: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, payload).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      }),
    );
  }

  requestEmailCode(
    payload: RequestEmailCodeRequest,
  ): Observable<ApiResponse<VerificationCodeResponseData>> {
    return this.http.post<ApiResponse<VerificationCodeResponseData>>(
      `${this.apiUrl}/request-email-code`,
      payload,
    );
  }

  requestPhoneCode(
    payload: RequestPhoneCodeRequest,
  ): Observable<ApiResponse<VerificationCodeResponseData>> {
    return this.http.post<ApiResponse<VerificationCodeResponseData>>(
      `${this.apiUrl}/request-phone-code`,
      payload,
    );
  }

  register(payload: RegisterRequest): Observable<ApiResponse<RegisterResponseData>> {
    return this.http.post<ApiResponse<RegisterResponseData>>(`${this.apiUrl}/register`, payload);
  }

  logout(): void {
    this.removeStorageItem(this.tokenKey);
    this.removeStorageItem(this.userKey);

    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.getStorageItem(this.tokenKey);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(allowedRoles: UserRole[]): boolean {
    const user = this.getCurrentUser();

    if (!user) {
      return false;
    }

    return allowedRoles.includes(user.role);
  }

  private setSession(loginResponse: LoginResponse): void {
    if (!this.isBrowser()) {
      return;
    }

    localStorage.setItem(this.tokenKey, loginResponse.token);
    localStorage.setItem(this.userKey, JSON.stringify(loginResponse.user));

    this.currentUserSubject.next(loginResponse.user);
  }

  private getStoredUser(): User | null {
    const storedUser = this.getStorageItem(this.userKey);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      this.removeStorageItem(this.userKey);
      return null;
    }
  }

  private getStorageItem(key: string): string | null {
    if (!this.isBrowser()) {
      return null;
    }

    return localStorage.getItem(key);
  }

  private removeStorageItem(key: string): void {
    if (!this.isBrowser()) {
      return;
    }

    localStorage.removeItem(key);
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
