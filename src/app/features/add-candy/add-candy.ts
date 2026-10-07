import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CandyService } from '../../core/services/candy.service';
import { Candy } from '../../core/models/candyinterface';

@Component({
    imports: [ReactiveFormsModule, FormsModule],
    selector: 'app-add-candy',
    styleUrl: './add-candy.css',
    templateUrl: './add-candy.html',
})
export class AddCandy {

    private candyService = inject(CandyService);
    candys = this.candyService.candy;
    tiposCandy = ['Combo', 'Pochoclo', 'Bebidas', 'Snacks'];
    busquedaAdmin: string = '';
    tipoCandySeleccionadoAdmin: string = 'TODOS';
    imagenSeleccionada: File | null = null;
    imagenActual: string | null = null;
    previewImagen: string | null = null;
    editandoId = signal<string | null>(null);

    candyForm = new FormGroup({
        nombre_candy: new FormControl('', [
            Validators.required,
            Validators.minLength(4),
            Validators.maxLength(100)
        ]),

        tipo_candy: new FormControl('', [
            Validators.required
        ]),

        precio: new FormControl(0, [
            Validators.required
        ]),

        disponible: new FormControl(true),

        descripcion: new FormControl('', [
            Validators.required,
            Validators.minLength(5),
            Validators.maxLength(100)
        ])
    });

    get f() {
        return this.candyForm.controls;
    }

    seleccionarTipoCandyAdmin(tipo: string) {
        this.tipoCandySeleccionadoAdmin = tipo;
    }

    candyFiltradoAdmin() {
        return this.candys().filter(candy => {
            const coincideNombre = candy.nombre_candy.toLowerCase().includes(this.busquedaAdmin.toLowerCase());
            const coincideTipo = this.tipoCandySeleccionadoAdmin === 'TODOS' || candy.tipo_candy === this.tipoCandySeleccionadoAdmin;

            return coincideNombre && coincideTipo;
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

    quitarImagen() {
        this.imagenSeleccionada = null;

        if (this.previewImagen) {
            URL.revokeObjectURL(this.previewImagen);
            this.previewImagen = null;
        }

        this.limpiarInputImagen();
    }

    limpiarInputImagen() {
        const input = document.getElementById('imagen-candy') as HTMLInputElement;

        if (input) {
            input.value = '';
        }
    }

    iniciarEdicion(candy: Candy) {
        this.editandoId.set(candy.candy_id);
        this.imagenActual = candy.img_url;
        this.imagenSeleccionada = null;

        if (this.previewImagen) {
            URL.revokeObjectURL(this.previewImagen);
            this.previewImagen = null;
        }

        this.limpiarInputImagen();

        this.candyForm.setValue({
            nombre_candy: candy.nombre_candy,
            tipo_candy: candy.tipo_candy,
            precio: candy.precio,
            disponible: candy.disponible,
            descripcion: candy.descripcion
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

        this.candyForm.reset({
            disponible: true,
            precio: 0
        });
    }

    async onSubmit(): Promise<void> {
        this.candyForm.markAllAsTouched();

        if (this.candyForm.invalid) {
            return;
        }

        const idEnEdicion = this.editandoId();

        if (!idEnEdicion && !this.imagenSeleccionada) {
            alert('Seleccioná una imagen para el candy.');
            return;
        }

        const imagenAnterior = this.imagenActual;
        let imgUrl = this.imagenActual || '';

        if (this.imagenSeleccionada) {
            const nuevaUrl = await this.candyService.subirImagenCandy(this.imagenSeleccionada);

            if (!nuevaUrl) {
                alert('Error al subir la imagen.');
                return;
            }
            imgUrl = nuevaUrl;
        }

        const formValue = this.candyForm.getRawValue();

        const datosCandy = {
            nombre_candy: formValue.nombre_candy!,
            img_url: imgUrl,
            tipo_candy: formValue.tipo_candy!,
            precio: formValue.precio!,
            disponible: formValue.disponible!,
            descripcion: formValue.descripcion!
        };

        const exito = idEnEdicion
            ? await this.candyService.editarCandy(idEnEdicion, datosCandy)
            : await this.candyService.agregarCandy(datosCandy);

        if (exito) {
            if (idEnEdicion && this.imagenSeleccionada && imagenAnterior) {
                await this.candyService.borrarImagenCandy(imagenAnterior);
            }

            alert(idEnEdicion
                ? `Candy "${formValue.nombre_candy}" editado exitosamente!`
                : `Candy "${formValue.nombre_candy}" agregado exitosamente!`);

            this.cancelarEdicion();
        } else {
            if (this.imagenSeleccionada && imgUrl !== imagenAnterior) {
                await this.candyService.borrarImagenCandy(imgUrl);
            }
            alert('Error al guardar el candy. Intenta nuevamente.');
        }
    }
}