import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormsModule } from '@angular/forms';
import { PeliculaService } from '../../core/services/pelicula.service';
import { Pelicula } from '../../core/models/peliculainterface';

@Component({
    selector: 'app-pelicula-book',
    imports: [ReactiveFormsModule, FormsModule],
    templateUrl: './add-pelicula.html',
    styleUrl: './add-pelicula.css'
})
export class AddPelicula {

    private peliculaService = inject(PeliculaService);
    peliculas = this.peliculaService.peliculas;
    generos = ['Accion', 'Comedia', 'Drama', 'Terror', 'Ciencia Ficción', 'Fantasia', 'Romance', 'Suspenso', 'Aventura', 'Bibliografico', 'Animacion'];
    estados = ['CARTELERA', 'PREVENTA'];
    edad_restriccion = ['ATP', '+13', '+18'];
    busquedaAdmin: string = '';
    generoSeleccionadoAdmin: string = 'TODOS';
    estadoSeleccionadoAdmin: string = 'TODOS';
    imagenSeleccionada: File | null = null;
    imagenActual: string | null = null;
    previewImagen: string | null = null;
    editandoId = signal<string | null>(null);

    peliculaForm = new FormGroup({
        pelicula_titulo: new FormControl('', [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(100)
        ]),

        sinopsis: new FormControl('', [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(1000)
        ]),

        genero: new FormControl<string[]>([], [
            Validators.required
        ]),

        duracion: new FormControl<number | null>(null, [
            Validators.required,
            Validators.min(1)
        ]),

        edad_restriccion: new FormControl('', [
            Validators.required
        ]),

        disponible: new FormControl(true),

        estado: new FormControl('', [
            Validators.required
        ])
    });

    get f() {
        return this.peliculaForm.controls;
    }

    seleccionarGeneroAdmin(genero: string) {
        this.generoSeleccionadoAdmin = genero;
    }

    seleccionarEstadoAdmin(estado: string) {
        this.estadoSeleccionadoAdmin = estado;
    }

    peliculasFiltradasAdmin() {
        return this.peliculas().filter(pelicula => {
            const coincideNombre = pelicula.pelicula_titulo.toLowerCase().includes(this.busquedaAdmin.toLowerCase());
            const coincideGenero = this.generoSeleccionadoAdmin === 'TODOS' || pelicula.genero.includes(this.generoSeleccionadoAdmin);
            const coincideEstado = this.estadoSeleccionadoAdmin === 'TODOS' || pelicula.estado === this.estadoSeleccionadoAdmin;

            return coincideNombre && coincideGenero && coincideEstado;
        });
    }

    seleccionarImagen(event: Event) {
        const input = event.target as HTMLInputElement;

        if (!input.files || input.files.length === 0) {
            return;
        }

        if (this.previewImagen) {
            URL.revokeObjectURL(this.previewImagen);
        }

        this.imagenSeleccionada = input.files[0];
        this.previewImagen = URL.createObjectURL(this.imagenSeleccionada);
    }

    toggleGenero(genero: string, event: Event) {
        const checked = (event.target as HTMLInputElement).checked;
        const actuales = this.peliculaForm.controls.genero.value || [];

        if (checked) {
            this.peliculaForm.controls.genero.setValue([...actuales, genero]);
        } else {
            this.peliculaForm.controls.genero.setValue(actuales.filter(g => g !== genero));
        }
    }

    iniciarEdicion(pelicula: Pelicula) {
        this.editandoId.set(pelicula.pelicula_id);
        this.imagenActual = pelicula.img_url;
        this.imagenSeleccionada = null;

        if (this.previewImagen) {
            URL.revokeObjectURL(this.previewImagen);
            this.previewImagen = null;
        }

        this.limpiarInputImagen();

        this.peliculaForm.setValue({
            pelicula_titulo: pelicula.pelicula_titulo,
            sinopsis: pelicula.sinopsis,
            genero: pelicula.genero,
            duracion: pelicula.duracion,
            edad_restriccion: pelicula.edad_restriccion,
            disponible: pelicula.disponible,
            estado: pelicula.estado
        });
    }

    cancelarEdicion() {
        this.editandoId.set(null);
        this.imagenSeleccionada = null;
        this.imagenActual = null;

        if (this.previewImagen) {
            URL.revokeObjectURL(this.previewImagen);
            this.previewImagen = null;
        }

        this.limpiarInputImagen();

        this.peliculaForm.reset({
            disponible: true,
            genero: []
        });
    }

    quitarImagen() {
        this.imagenSeleccionada = null;

        if (this.previewImagen) {
            URL.revokeObjectURL(this.previewImagen);
            this.previewImagen = null;
        }

        this.limpiarInputImagen();
    }

    limpiarInputImagen() {
        const input = document.getElementById('imagen') as HTMLInputElement;

        if (input) {
            input.value = '';
        }
    }

    async onSubmit(): Promise<void> {
        this.peliculaForm.markAllAsTouched();

        if (this.peliculaForm.invalid) {
            return;
        }

        const idEnEdicion = this.editandoId();

        if (!idEnEdicion && !this.imagenSeleccionada) {
            alert('Seleccioná una imagen para la película.');
            return;
        }

        const imagenAnterior = this.imagenActual;
        let imgUrl = this.imagenActual || '';

        if (this.imagenSeleccionada) {
            const nuevaUrl = await this.peliculaService.subirImagenPelicula(this.imagenSeleccionada);

            if (!nuevaUrl) {
                alert('Error al subir la imagen.');
                return;
            }

            imgUrl = nuevaUrl;
        }

        const formValue = this.peliculaForm.getRawValue();

        const datosPelicula = {
            pelicula_titulo: formValue.pelicula_titulo!,
            img_url: imgUrl,
            sinopsis: formValue.sinopsis!,
            genero: formValue.genero!,
            duracion: formValue.duracion!,
            edad_restriccion: formValue.edad_restriccion!,
            disponible: formValue.disponible!,
            estado: formValue.estado!
        };

        const exito = idEnEdicion
            ? await this.peliculaService.editarPelicula(idEnEdicion, datosPelicula)
            : await this.peliculaService.agregarPelicula(datosPelicula);

        if (exito) {
            if (idEnEdicion && this.imagenSeleccionada && imagenAnterior) {
                await this.peliculaService.borrarImagenPelicula(imagenAnterior);
            }

            alert(idEnEdicion
                ? `Película "${formValue.pelicula_titulo}" editada exitosamente!`
                : `Película "${formValue.pelicula_titulo}" agregada exitosamente!`);

            this.cancelarEdicion();
        } else {
            if (this.imagenSeleccionada && imgUrl !== imagenAnterior) {
                await this.peliculaService.borrarImagenPelicula(imgUrl);
            }

            alert('Error al guardar la película. Intenta nuevamente.');
        }
    }

    async eliminarPelicula(pelicula: Pelicula) {
        const confirmar = confirm(`¿Seguro que querés eliminar "${pelicula.pelicula_titulo}"?`);

        if (!confirmar) {
            return;
        }

        const exito = await this.peliculaService.eliminarPelicula(pelicula.pelicula_id, pelicula.img_url);

        if (exito) {
            alert(`Película "${pelicula.pelicula_titulo}" eliminada exitosamente!`);

            if (this.editandoId() === pelicula.pelicula_id) {
                this.cancelarEdicion();
            }
        } else {
            alert('Error al eliminar la película.');
        }
    }
}