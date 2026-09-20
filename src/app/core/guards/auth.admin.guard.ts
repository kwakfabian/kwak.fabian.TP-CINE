import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificamos si hay un usuario logueado en el Signal
  const user = authService.currentUserData();
  
  if (user?.rol === "admin") {
    return true;
  }
  console.log("Debes tener rol admin para a acceder a esta ruta")

  // Si no hay sesión, redirigimos al login
  return router.createUrlTree(['/home']);
};