import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { PeliculaService } from '../../core/services/pelicula.service';
import { FuncionService } from '../../core/services/funcion.service';

@Component({
  imports: [],
  selector: 'app-detail-pelicula',
  styleUrl: './detail-pelicula.css',
  templateUrl: './detail-pelicula.html',
})
export class DetailPelicula implements OnInit {

  peliculaService = inject(PeliculaService);
  funcionService = inject(FuncionService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  peliculaId = this.route.snapshot.paramMap.get('id')!;

  pelicula = this.peliculaService.getPeliculasId(this.peliculaId);

  fechaSeleccionada = signal<string | null>(null);
  horarioSeleccionado = signal<string | null>(null);
  cantidadBoletos = signal<number>(1);

  ngOnInit() {
    this.funcionService.cargarFuncionesDePelicula(this.peliculaId);
  }

  fechasDisponibles = computed(() => {
    const fechas = this.funcionService.funciones().map(f => f.fecha);
    return [...new Set(fechas)];
  });

  horariosDelDia = computed(() => {
    if (!this.fechaSeleccionada()) return [];

    return this.funcionService.funciones().filter(
      f => f.fecha === this.fechaSeleccionada()
    );
  });

  puedeComprar = computed(() =>
    !!this.fechaSeleccionada() &&
    !!this.horarioSeleccionado() &&
    this.cantidadBoletos() > 0
  );

  elegirFecha(fecha: string) {
    this.fechaSeleccionada.set(fecha);
    this.horarioSeleccionado.set(null);
  }

  elegirHorario(funcionId: string) {
    this.horarioSeleccionado.set(funcionId);
  }

  comprar() {

    const funcionId = this.horarioSeleccionado();
    if (!funcionId) {
      return;
    }
    this.router.navigate(['/comprar',funcionId,'butacas'], {
      queryParams: {
        cantidad: this.cantidadBoletos()
      }
    });
  }
}