import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PeliculaService } from '../../core/services/pelicula.service';
import { Pelicula } from '../../core/models/peliculainterface';

@Component({
  selector: 'app-pelicula-book',
  imports: [ReactiveFormsModule],
  templateUrl: './add-pelicula.html',
  styleUrl: './add-pelicula.css'
})
export class AddPelicula {
  private peliculaService = inject(PeliculaService);
  private router = inject(Router);

  peliculas = this.peliculaService.peliculas;

  generos = ['Accion', 'Comedia', 'Drama', 'Terror', 'Ciencia Ficción', 'Fantasia', 'Romance', 'Suspenso', 'Aventura', 'Bibliografico', 'Animacion'];
  estados = ['MAS POPULARES', 'CARTELERA', 'PREVENTA'];
  edad_restriccion = ['ATP', '+13', '+18'];

  editandoId = signal<string | null>(null);

  peliculaForm = new FormGroup({
    pelicula_titulo: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100)
    ]),

    img_url: new FormControl('', [
      Validators.required,
      Validators.pattern(/^https?:\/\/.+/)
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
      Validators.min(1),
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

    this.peliculaForm.setValue({
      pelicula_titulo: pelicula.pelicula_titulo,
      img_url: pelicula.img_url,
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
    this.peliculaForm.reset({
      disponible: true,
      genero: []
    });
  }

  async onSubmit(): Promise<void> {
    this.peliculaForm.markAllAsTouched();

    if (this.peliculaForm.invalid) {
      return;
    }

    const formValue = this.peliculaForm.getRawValue();

    const datosPelicula = {
      pelicula_titulo: formValue.pelicula_titulo!,
      img_url: formValue.img_url!,
      sinopsis: formValue.sinopsis!,
      genero: formValue.genero!,
      duracion: formValue.duracion!,
      edad_restriccion: formValue.edad_restriccion!,
      disponible: formValue.disponible!,
      estado: formValue.estado!
    };

    const idEnEdicion = this.editandoId();

    const exito = idEnEdicion
      ? await this.peliculaService.editarPelicula(idEnEdicion, datosPelicula)
      : await this.peliculaService.agregarPelicula(datosPelicula);

    if (exito) {
      alert(idEnEdicion
        ? `Película "${formValue.pelicula_titulo}" editada exitosamente!`
        : `Película "${formValue.pelicula_titulo}" agregada exitosamente!`);

      this.cancelarEdicion();
    } else {
      alert('Error al guardar la película. Intenta nuevamente.');
    }
  }
}