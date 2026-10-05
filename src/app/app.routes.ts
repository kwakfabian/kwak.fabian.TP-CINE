import { Routes } from '@angular/router';
import { authAdminGuard } from './core/guards/auth.admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { authEmpleadoGuard } from './core/guards/auth.empleado.guard';

export const routes: Routes = [

    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', loadComponent: () => import('./features/home/home').then((component) => component.Home)},
    { path: 'candy', loadComponent: () => import('./features/candy/candy').then((component) => component.Candy)},
    { path: 'perfil', loadComponent: () => import('./features/perfil/perfil').then((component) => component.Perfil), canActivate: [authGuard]},
    { path: 'pelicula/:id', loadComponent: () => import('./features/detail-pelicula/detail-pelicula').then((component) => component.DetailPelicula)},
    { path: 'comprar/:funcionId/butacas', loadComponent: () => import('./features/butacas/butacas').then((component) => component.Butacas)},
    { path: 'confirmar-compra', loadComponent: () => import('./features/confirmar-compra/confirmar-compra').then((component) => component.ConfirmarCompra) },
    { path: 'validar-entrada', loadComponent: () => import('./features/empleado/validar-entrada/validar-entrada').then((component) => component.ValidarEntrada), canActivate: [authEmpleadoGuard]},
    { path: 'admin-config',loadComponent: () => import('./features/admin-config/admin-config').then((component) => component.AdminConfig),canActivate: [authAdminGuard]},
    { path: 'add-pelicula', loadComponent: () => import('./features/add-pelicula/add-pelicula').then((component) => component.AddPelicula), canActivate: [authAdminGuard]},
    { path: 'add-funcion', loadComponent: () => import('./features/add-funcion/add-funcion').then((component) => component.AddFuncion), canActivate: [authAdminGuard]},
    { path: 'add-candy', loadComponent: () => import('./features/add-candy/add-candy').then((component) => component.AddCandy), canActivate: [authAdminGuard]},
    { path: 'login', loadComponent: () => import('./features/auth/login/login').then((component) => component.LoginComponent)},
    { path: 'register', loadComponent: () => import('./features/auth/register/register').then((component) => component.RegisterComponent)},
    { path: '**', redirectTo: '/home' }

];