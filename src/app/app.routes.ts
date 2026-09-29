import { Routes } from '@angular/router';
import { authAdminGuard } from './core/guards/auth.admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register'
import { Home } from './features/home/home';
import { Candy } from './features/candy/candy';
import { DetailPelicula } from './features/detail-pelicula/detail-pelicula';
import { Favoritos } from './features/favoritos/favoritos';
import { AddPelicula } from './features/add-pelicula/add-pelicula';
import { AddCandy } from './features/add-candy/add-candy';

export const routes: Routes = [

    { path: '', redirectTo: '/home', pathMatch: 'full'},

    {path: 'home', component: Home},
    {path: 'candy', component: Candy},
    {path: 'favoritos', component: Favoritos, canActivate: [authGuard]},
    {path: 'pelicula/:id', component: DetailPelicula},
    {path: 'add-pelicula', component: AddPelicula, canActivate: [authAdminGuard]},
    {path: 'add-candy', component: AddCandy, canActivate: [authAdminGuard]},
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},

    { path: '**', redirectTo: '/home' }

];
