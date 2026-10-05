import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Resena } from '../models/resenainterface';

@Injectable({
    providedIn: 'root'
})
export class ResenaService {

    private supabase = inject(SupabaseService).client;

    resenasUsuario = signal<Resena[]>([]);

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