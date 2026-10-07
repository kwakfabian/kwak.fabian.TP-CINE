import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Resena } from '../models/resenainterface';

export interface ResenaConUsuario extends Resena {
    usuario?: {
        nombre: string;
        apellido: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class ResenaService {

    private supabase = inject(SupabaseService).client;

    resenasUsuario = signal<Resena[]>([]);
    resenasPelicula = signal<ResenaConUsuario[]>([]);

    async cargarResenasUsuario(usuarioId: string) {
        const { data, error } = await this.supabase
            .from('resenas')
            .select('*')
            .eq('usuario_id', usuarioId);

        if (error) {
            console.error('Error al cargar las reseñas:', error.message);
            this.resenasUsuario.set([]);
            return;
        }

        this.resenasUsuario.set(data ?? []);
    }

    async cargarResenasPelicula(peliculaId: string) {
        const { data: resenas, error } = await this.supabase
            .from('resenas')
            .select('*')
            .eq('pelicula_id', peliculaId)
            .order('fecha_creacion', { ascending: false });

        if (error) {
            console.error('Error al cargar las reseñas:', error.message);
            this.resenasPelicula.set([]);
            return;
        }

        if (!resenas || resenas.length === 0) {
            this.resenasPelicula.set([]);
            return;
        }

        const usuariosIds = [...new Set(resenas.map(resena => resena.usuario_id))];

        const { data: usuarios, error: errorUsuarios } = await this.supabase
            .from('usuarios')
            .select('usuario_id, nombre, apellido')
            .in('usuario_id', usuariosIds);

        if (errorUsuarios) {
            console.error('Error al cargar los usuarios:', errorUsuarios.message);
            this.resenasPelicula.set(resenas);
            return;
        }

        const resenasConUsuario: ResenaConUsuario[] = resenas.map(resena => {
            const usuario = usuarios?.find(
                usuario => usuario.usuario_id === resena.usuario_id
            );

            return {
                ...resena,
                usuario: usuario ? {
                    nombre: usuario.nombre,
                    apellido: usuario.apellido
                } : undefined
            };
        });

        this.resenasPelicula.set(resenasConUsuario);
    }

    promedioPelicula(): number {
        const resenas = this.resenasPelicula();

        if (resenas.length === 0) {
            return 0;
        }

        const total = resenas.reduce(
            (suma, resena) => suma + resena.estrellas,
            0
        );

        return total / resenas.length;
    }

    obtenerResenaPelicula(peliculaId: string): Resena | undefined {
        return this.resenasUsuario().find(
            resena => resena.pelicula_id === peliculaId
        );
    }

    async guardarResena(resena: Resena): Promise<boolean> {
        const resenaExistente = this.obtenerResenaPelicula(resena.pelicula_id);

        if (resenaExistente) {
            const { error } = await this.supabase
                .from('resenas')
                .update({
                    estrellas: resena.estrellas,
                    comentario: resena.comentario
                })
                .eq('resena_id', resenaExistente.resena_id!);

            if (error) {
                console.error('Error al editar la reseña:', error.message);
                return false;
            }
        } else {
            const { error } = await this.supabase
                .from('resenas')
                .insert([resena]);

            if (error) {
                console.error('Error al guardar la reseña:', error.message);
                return false;
            }
        }

        await this.cargarResenasUsuario(resena.usuario_id);

        return true;
    }

    async eliminarResena(resenaId: string, usuarioId: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('resenas')
            .delete()
            .eq('resena_id', resenaId)
            .eq('usuario_id', usuarioId);

        if (error) {
            console.error('Error al eliminar la reseña:', error.message);
            return false;
        }

        await this.cargarResenasUsuario(usuarioId);

        return true;
    }
}