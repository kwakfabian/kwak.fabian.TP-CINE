import { Component, inject } from '@angular/core';
import { PeliculaService } from '../../core/services/pelicula.service';
import { PeliculaCard } from '../../shares/pelicula-card/pelicula-card'

@Component({
  imports: [PeliculaCard],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {

  peliculaService = inject(PeliculaService);

  peliculas = this.peliculaService.peliculas;
}
