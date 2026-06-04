import { Injectable } from '@angular/core'; // se importa el decorador Injectable para definir un servicio que se pueda inyectar en otros componentes o servicios, y se importan CanActivate y Router para definir una guardia de ruta que verifique si el usuario esta autenticado antes de permitir el acceso a ciertas rutas
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // se importa el servicio de autenticacion para verificar si el usuario esta autenticado

@Injectable({
  // se define el servicio como inyectable y disponible en toda la aplicacion
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
