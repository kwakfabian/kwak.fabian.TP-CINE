  import { Component, inject } from '@angular/core';
  import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
  import { CandyService } from '../../core/services/candy.service';
  import { Router } from '@angular/router';

  @Component({
    imports: [ReactiveFormsModule],
    selector: 'app-add-candy',
    styleUrl: './add-candy.css',
    templateUrl: './add-candy.html',
  })
  export class AddCandy {
    private candyService = inject(CandyService);
    private router = inject(Router)

    tiposCandy = ['Combo', 'Pochoclo', 'Bebidas', 'Snacks']

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

      disponible: new FormControl(true, [
        Validators.required
      ])
    });

    get f() {
      return this.candyForm.controls;
    }

    async onSubmit(): Promise<void> {
      this.candyForm.markAllAsTouched();

      if (this.candyForm.invalid) {
        return;
      }

      const formValue = this.candyForm.getRawValue();

      const exito = await this.candyService.agregarCandy({
        nombre_candy: formValue.nombre_candy!,
        img_url: formValue.img_url!,
        tipo_candy: formValue.tipo_candy!,
        disponible: formValue.disponible!
      });

      if (exito) {
        alert(`Candy "${formValue.nombre_candy}" agregado exitosamente!`);
        this.router.navigate(['/home']);
      } else {
        alert('Error al agregar la candy. Intenta nuevamente.')
      }
    }


  }
