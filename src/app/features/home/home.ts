import { Component, inject } from '@angular/core';
import { PeliculaService } from '../../core/services/pelicula.service';
import { PeliculaCard } from '../../shares/pelicula-card/pelicula-card'
import { FormsModule } from '@angular/forms';

@Component({
  imports: [PeliculaCard, FormsModule],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {

  peliculaService = inject(PeliculaService);

  peliculas = this.peliculaService.peliculas;

  busqueda: string = '';

    generoSeleccionado: string = 'TODOS';

    generos: string[] = [
        'Accion',
        'Aventura',
        'Comedia',
        'Drama',
        'Terror',
        'Ciencia ficcion',
        'Romance',
        'Animacion'
    ];

    seleccionarGenero(genero: string) {
        this.generoSeleccionado = genero;
    }

    peliculasFiltradas() {
        return this.peliculas().filter(pelicula => {

            if (pelicula.estado !== 'CARTELERA') {
                return false;
            }

            const coincideNombre =
                pelicula.pelicula_titulo
                    .toLowerCase()
                    .includes(this.busqueda.toLowerCase());

            const coincideGenero =
                this.generoSeleccionado === 'TODOS' ||
                pelicula.genero.includes(this.generoSeleccionado);

            return coincideNombre && coincideGenero;
        });
    }
}
