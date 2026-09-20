import { Component, input, output, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Pelicula } from '../../core/models/peliculainterface';
import { FavoritoService } from '../../core/services/favorito.service';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  selector: 'app-pelicula-card',
  styleUrl: './pelicula-card.css',
  templateUrl: './pelicula-card.html',
})
export class PeliculaCard {
  authService = inject(AuthService);
  private favoritoService = inject(FavoritoService);

  // pelicula = input.required<Pelicula>();

  pelicula: Pelicula= {
    id: 1,
    titulo: "Titanic",
    img: "https://m.media-amazon.com/images/M/MV5BYzYyN2FiZmUtYWYzMy00MzViLWJkZTMtOGY1ZjgzNWMwN2YxXkEyXkFqcGc@._V1_.jpg",
    categoria: "+18",
    generos: "Romance",
    precio: 5000,
    disponible: true
  }

  funcion(){

  }

}
