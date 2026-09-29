import { Component, input, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Pelicula } from '../../core/models/peliculainterface';
import { FavoritoService } from '../../core/services/favorito.service';

@Component({
  imports: [],
  selector: 'app-pelicula-card',
  styleUrl: './pelicula-card.css',
  templateUrl: './pelicula-card.html',
})
export class PeliculaCard {
  authService = inject(AuthService);
  private favoritoService = inject(FavoritoService);

  pelicula = input.required<Pelicula>();

  agregarAFavoritos() {
    const pelicula = this.pelicula();
    this.favoritoService.agregarFavorito({
      pelicula_id: pelicula.pelicula_id,
      nota: ''
    });
  }

}
