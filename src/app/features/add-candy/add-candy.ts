import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CandyService } from '../../core/services/candy.service';
import { Router } from '@angular/router';
import { Candy } from '../../core/models/candyinterface';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-add-candy',
  styleUrl: './add-candy.css',
  templateUrl: './add-candy.html',
})
export class AddCandy {
  private candyService = inject(CandyService);
  private router = inject(Router);

  candys = this.candyService.candy;

  tiposCandy = ['Combo', 'Pochoclo', 'Bebidas', 'Snacks'];

  editandoId = signal<string | null>(null);

  candyForm = new FormGroup({
    nombre_candy: new FormControl('', [
      Validators.required,
      Validators.minLength(4),
      Validators.maxLength(100)
    ]),

    img_url: new FormControl('', [
      Validators.required,
      Validators.pattern(/^https?:\/\/.+/)
    ]),

    tipo_candy: new FormControl('', [
      Validators.required
    ]),

    precio: new FormControl(0, [
      Validators.required
    ]),

    disponible: new FormControl(true)
  });

  get f() {
    return this.candyForm.controls;
  }

  iniciarEdicion(candy: Candy) {
    this.editandoId.set(candy.candy_id);

    this.candyForm.setValue({
      nombre_candy: candy.nombre_candy,
      img_url: candy.img_url,
      tipo_candy: candy.tipo_candy,
      precio: candy.precio,
      disponible: candy.disponible
    });
  }

  cancelarEdicion() {
    this.editandoId.set(null);
    this.candyForm.reset({
      disponible: true
    });
  }

  async onSubmit(): Promise<void> {
    this.candyForm.markAllAsTouched();

    if (this.candyForm.invalid) {
      return;
    }

    const formValue = this.candyForm.getRawValue();

    const datosCandy = {
      nombre_candy: formValue.nombre_candy!,
      img_url: formValue.img_url!,
      tipo_candy: formValue.tipo_candy!,
      precio: formValue.precio!,
      disponible: formValue.disponible!
    };

    const idEnEdicion = this.editandoId();

    const exito = idEnEdicion
      ? await this.candyService.editarCandy(idEnEdicion, datosCandy)
      : await this.candyService.agregarCandy(datosCandy);

    if (exito) {
      alert(idEnEdicion
        ? `Candy "${formValue.nombre_candy}" editado exitosamente!`
        : `Candy "${formValue.nombre_candy}" agregado exitosamente!`);

      this.cancelarEdicion();
    } else {
      alert('Error al guardar el candy. Intenta nuevamente.');
    }
  }
}