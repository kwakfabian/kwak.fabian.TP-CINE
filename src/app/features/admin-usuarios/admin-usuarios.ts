import { Component, inject, OnInit, signal } from '@angular/core';
import { UsuarioService } from '../../core/services/usuario.service';

@Component({
    selector: 'app-admin-usuarios',
    imports: [],
    templateUrl: './admin-usuarios.html',
    styleUrl: './admin-usuarios.css'
})
export class AdminUsuarios implements OnInit {

    usuarioService = inject(UsuarioService);

    cargando = signal(true);
    mensaje = signal<string | null>(null);

    async ngOnInit() {
    await this.usuarioService.cargarUsuarios();

    console.log(this.usuarioService.usuarios());

    this.cargando.set(false);
}
    async cambiarRol(usuarioId: string, event: Event) {

        const select = event.target as HTMLSelectElement;
        const nuevoRol = select.value;

        const resultado = await this.usuarioService.cambiarRol(
            usuarioId,
            nuevoRol
        );

        if (resultado) {
            this.mensaje.set('Rol actualizado correctamente.');
        } else {
            this.mensaje.set('No se pudo actualizar el rol.');
        }
    }
}