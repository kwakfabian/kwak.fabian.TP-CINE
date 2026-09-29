import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PeliculaService } from '../../core/services/pelicula.service';

@Component({
  selector: 'app-pelicula-book',
  imports: [ReactiveFormsModule],
  templateUrl: './add-pelicula.html',
  styleUrl: './add-pelicula.css'
})
export class AddPelicula {
  private peliculaService = inject(PeliculaService);
  private router = inject(Router);

  generos = ['Novela', 'Distopía', 'Fábula', 'Realismo Mágico', 'Ciencia Ficción', 'Terror', 'Poesía', 'Ensayo', 'Historia'];
  estados = ["MAS POPULARES", "CARTELERA", "PREVENTA"]
  
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
    
    genero: new FormControl<string[]>([], [
      Validators.required
    ]),
    
    duracion: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
    ]),
    
    edad_restriccion: new FormControl('', [
      Validators.required,
      Validators.maxLength(5)
    ]),
    
    disponible: new FormControl(true, [
      Validators.required
    ]),

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

  async onSubmit(): Promise<void> {
    this.peliculaForm.markAllAsTouched();

    if (this.peliculaForm.invalid) {
      return;
    }

    const formValue = this.peliculaForm.getRawValue();

    const exito = await this.peliculaService.agregarPelicula({
      pelicula_titulo: formValue.pelicula_titulo!,
      img_url: formValue.img_url!,
      genero: formValue.genero!,
      duracion: formValue.duracion!,
      edad_restriccion: formValue.edad_restriccion!,
      disponible: formValue.disponible!,
      estado: formValue.estado!
    });

    if (exito) {
      alert(`Pelicula "${formValue.pelicula_titulo}" agregado exitosamente!`);
      this.router.navigate(['/home']);
    } else {
      alert('Error al agregar la pelicula. Intenta nuevamente.');
    }
  }
}