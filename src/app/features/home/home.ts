import { Component , signal, computed, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { PeliculaCard } from '../../shares/pelicula-card/pelicula-card'

@Component({
  imports: [PeliculaCard],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {}
