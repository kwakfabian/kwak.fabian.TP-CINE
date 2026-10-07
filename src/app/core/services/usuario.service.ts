import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Usuario } from '../models/usuariointerface';

@Injectable({ providedIn: 'root' })

export class UsuarioService {

    private supabase = inject(SupabaseService).client;
    usuarios = signal<Usuario[]>([]);

    async cargarUsuarios() {

        const { data, error } = await this.supabase
            .from('usuarios')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) {
            console.error('Error al cargar usuarios:', error.message);
            return;
        }

        this.usuarios.set(data ?? []);
    }

    async cambiarRol(usuarioId: string, nuevoRol: string): Promise<boolean> {

        const { error } = await this.supabase
            .from('usuarios')
            .update({
                rol: nuevoRol
            })
            .eq('usuario_id', usuarioId);

        if (error) {
            console.error('Error al cambiar el rol:', error.message);
            return false;
        }

        this.usuarios.update(usuarios =>
            usuarios.map(usuario =>
                usuario.usuario_id === usuarioId
                    ? { ...usuario, rol: nuevoRol }
                    : usuario
            )
        );

        return true;
    }
}