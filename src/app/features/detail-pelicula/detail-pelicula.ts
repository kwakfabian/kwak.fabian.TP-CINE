import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PeliculaService } from '../../core/services/pelicula.service';
import { FuncionService } from '../../core/services/funcion.service';
import { CompraService } from '../../core/services/compra.service';
import { ResenaService } from '../../core/services/resena.service';

@Component({
    imports: [],
    selector: 'app-detail-pelicula',
    styleUrl: './detail-pelicula.css',
    templateUrl: './detail-pelicula.html',
})
export class DetailPelicula implements OnInit {

    peliculaService = inject(PeliculaService);
    funcionService = inject(FuncionService);
    resenaService = inject(ResenaService);

    private compraService = inject(CompraService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    peliculaId = this.route.snapshot.paramMap.get('id')!;

    pelicula = this.peliculaService.getPeliculasId(this.peliculaId);

    fechaSeleccionada = signal<string | null>(null);
    horarioSeleccionado = signal<string | null>(null);
    cantidadBoletos = signal<number>(1);

    fechasDisponibles = computed(() => {
        const fechas = this.funcionService.funciones()
            .filter(funcion =>
                funcion.peliculas_id === this.peliculaId &&
                this.funcionDisponible(funcion.fecha, funcion.hora_inicio)
            )
            .map(funcion => funcion.fecha);

        return [...new Set(fechas)];
    });

    horariosDisponibles = computed(() => {
        const fecha = this.fechaSeleccionada();

        if (!fecha) {
            return [];
        }

        return this.funcionService.funciones().filter(funcion =>
            funcion.peliculas_id === this.peliculaId &&
            funcion.fecha === fecha &&
            this.funcionDisponible(funcion.fecha, funcion.hora_inicio)
        );
    });

    promedioResenas = computed(() => {
        const resenas = this.resenaService.resenasPelicula();

        if (resenas.length === 0) {
            return 0;
        }

        const total = resenas.reduce((suma, resena) => suma + resena.estrellas, 0);

        return total / resenas.length;
    });

    ngOnInit() {
        this.funcionService.cargarFuncionesDePelicula(this.peliculaId);
        this.resenaService.cargarResenasPelicula(this.peliculaId);
    }

    funcionDisponible(fecha: string, hora: string): boolean {
        const fechaHoraFuncion = new Date(`${fecha}T${hora}`);
        const ahora = new Date();

        return fechaHoraFuncion > ahora;
    }

    seleccionarFecha(fecha: string) {
        this.fechaSeleccionada.set(fecha);
        this.horarioSeleccionado.set(null);
    }

    seleccionarHorario(funcionId: string) {
        this.horarioSeleccionado.set(funcionId);
    }

    cambiarCantidad(event: Event) {
        const input = event.target as HTMLInputElement;
        const cantidad = Number(input.value);

        if (cantidad >= 1) {
            this.cantidadBoletos.set(cantidad);
        }
    }

    comprar() {
    const funcionId = this.horarioSeleccionado();

    if (!funcionId) {
        return;
    }

    this.compraService.setearFuncion(
        funcionId,
        this.cantidadBoletos()
    );

    this.router.navigate(
        ['/comprar', funcionId, 'butacas'],
        {
            queryParams: {
                cantidad: this.cantidadBoletos()
            }
        }
    );
}
}