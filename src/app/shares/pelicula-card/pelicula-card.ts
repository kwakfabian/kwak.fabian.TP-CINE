import { Component, input, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import { Pelicula } from '../../core/models/peliculainterface';

@Component({
  imports: [RouterLink],
  selector: 'app-pelicula-card',
  styleUrl: './pelicula-card.css',
  templateUrl: './pelicula-card.html',
})
export class PeliculaCard {
  authService = inject(AuthService);

  pelicula = input.required<Pelicula>();

}
