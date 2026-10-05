import { Component, inject, signal, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FuncionService } from '../../core/services/funcion.service';
import { PeliculaService } from '../../core/services/pelicula.service';
import { SalaService } from '../../core/services/sala.service';
import { Funcion } from '../../core/models/funcioninterface';

@Component({
    imports: [ReactiveFormsModule],
    selector: 'app-add-funcion',
    styleUrl: './add-funcion.css',
    templateUrl: './add-funcion.html',
})
export class AddFuncion implements OnInit {
    private funcionService = inject(FuncionService);
    private peliculaService = inject(PeliculaService);
    private salaService = inject(SalaService);

    funciones = this.funcionService.funciones;
    peliculas = this.peliculaService.peliculas;
    salas = this.salaService.salas;

    formatos = ['2D', '3D'];
    idiomas = ['Doblada', 'Subtitulada'];

    editandoId = signal<string | null>(null);

    funcionForm = new FormGroup({
        peliculas_id: new FormControl('', [Validators.required]),
        salas_id: new FormControl('', [Validators.required]),
        fecha: new FormControl('', [Validators.required]),
        hora_inicio: new FormControl('', [Validators.required]),
        formato: new FormControl('', [Validators.required]),
        idioma: new FormControl('', [Validators.required]),
    });

    get f() {
        return this.funcionForm.controls;
    }

    ngOnInit() {
        this.funcionService.cargarTodasLasFunciones();
    }

    iniciarEdicion(funcion: Funcion) {
        this.editandoId.set(funcion.funciones_id);

        this.funcionForm.setValue({
            peliculas_id: funcion.peliculas_id,
            salas_id: funcion.salas_id,
            fecha: funcion.fecha,
            hora_inicio: funcion.hora_inicio,
            formato: funcion.formato,
            idioma: funcion.idioma
        });
    }

    cancelarEdicion() {
        this.editandoId.set(null);
        this.funcionForm.reset();
    }

    // Ayuda visual: busca el título de la película, dado su id
    nombrePelicula(peliculaId: string): string {
        return this.peliculas().find(p => p.pelicula_id === peliculaId)?.pelicula_titulo || '—';
    }

    // Ayuda visual: busca el nombre de la sala, dado su id
    nombreSala(salaId: string): string {
        return this.salas().find(s => s.salas_id === salaId)?.nombre_salas || '—';
    }

    async onSubmit(): Promise<void> {
        this.funcionForm.markAllAsTouched();

        if (this.funcionForm.invalid) {
            return;
        }

        const formValue = this.funcionForm.getRawValue();

        const datosFuncion = {
            peliculas_id: formValue.peliculas_id!,
            salas_id: formValue.salas_id!,
            fecha: formValue.fecha!,
            hora_inicio: formValue.hora_inicio!,
            formato: formValue.formato!,
            idioma: formValue.idioma!,
        };

        const idEnEdicion = this.editandoId();

        const horarioValido = await this.funcionService.validarHorario(
            datosFuncion,
            idEnEdicion
        );

        if (!horarioValido) {
            alert('No puede haber otra función en la misma sala hasta 30 minutos después de que termine la función anterior.');
            return;
        }

        const exito = idEnEdicion
            ? await this.funcionService.editarFuncion(idEnEdicion, datosFuncion)
            : await this.funcionService.agregarFuncion(datosFuncion);

        if (exito) {
            alert(idEnEdicion ? 'Función editada exitosamente!' : 'Función agregada exitosamente!');
            this.cancelarEdicion();
            this.funcionService.cargarTodasLasFunciones();
        } else {
            alert('Error al guardar la función.');
        }
    }

    async eliminar(id: string) {
        if (confirm('¿Estás seguro de que querés eliminar esta función?')) {
            const exito = await this.funcionService.eliminarFuncion(id);

            if (exito) {
                alert('Función eliminada correctamente');
            } else {
                alert('Error al eliminar la función');
            }
        }
    }
}