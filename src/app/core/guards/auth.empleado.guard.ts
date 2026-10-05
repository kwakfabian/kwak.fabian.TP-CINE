import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authEmpleadoGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUserData();

  if (user?.rol === 'empleado') {
    return true;
  }

  console.log('Debes tener rol empleado para acceder a esta ruta');

  return router.createUrlTree(['/home']);
};