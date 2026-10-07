import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Funcion } from '../models/funcioninterface';

@Injectable({ providedIn: 'root' })

export class FuncionService {
    private supabase = inject(SupabaseService).client;

    funciones = signal<Funcion[]>([]);
    cargando = signal(false);

    async cargarFuncionesDePelicula(peliculaId: string) {
        this.cargando.set(true);

        const { data, error } = await this.supabase
            .from('funciones')
            .select('*')
            .eq('peliculas_id', peliculaId)
            .order('fecha', { ascending: true })
            .order('hora_inicio', { ascending: true });

        if (error) {
            console.error('Error al cargar funciones:', error.message);
            this.funciones.set([]);
        } else {
            this.funciones.set(data || []);
        }

        this.cargando.set(false);
    }

    async validarHorario(
        funcion: Omit<Funcion, 'funciones_id'>,
        funcionIdIgnorar: string | null = null
    ): Promise<boolean> {

        const { data: peliculaNueva, error: errorPeliculaNueva } = await this.supabase
            .from('peliculas')
            .select('duracion')
            .eq('pelicula_id', funcion.peliculas_id)
            .single();

        if (errorPeliculaNueva || !peliculaNueva) {
            console.error('Error al obtener la duracion de la pelicula.');
            return false;
        }

        const { data: funcionesSala, error: errorFunciones } = await this.supabase
            .from('funciones')
            .select('*')
            .eq('salas_id', funcion.salas_id)
            .eq('fecha', funcion.fecha);

        if (errorFunciones) {
            console.error('Error al buscar funciones de la sala:', errorFunciones.message);
            return false;
        }

        const horaAMinutos = (hora: string): number => {
            const partes = hora.split(':');
            return Number(partes[0]) * 60 + Number(partes[1]);
        };

        const inicioNueva = horaAMinutos(funcion.hora_inicio);
        const finNueva = inicioNueva + Number(peliculaNueva.duracion);

        for (const funcionExistente of funcionesSala || []) {

            if (funcionIdIgnorar && funcionExistente.funciones_id === funcionIdIgnorar) {
                continue;
            }

            const { data: peliculaExistente, error: errorPeliculaExistente } = await this.supabase
                .from('peliculas')
                .select('duracion')
                .eq('pelicula_id', funcionExistente.peliculas_id)
                .single();

            if (errorPeliculaExistente || !peliculaExistente) {
                console.error('Error al obtener la duracion de una pelicula existente.');
                return false;
            }

            const inicioExistente = horaAMinutos(funcionExistente.hora_inicio);
            const finExistente = inicioExistente + Number(peliculaExistente.duracion);
            const nuevaAntes = finNueva + 30 <= inicioExistente;
            const nuevaDespues = inicioNueva >= finExistente + 30;
            
            if (!nuevaAntes && !nuevaDespues) {
                return false;
            }
        }
        return true;
    }

    async agregarFuncion(funcion: Omit<Funcion, 'funciones_id'>): Promise<boolean> {

        const horarioValido = await this.validarHorario(funcion);

        if (!horarioValido) {
            return false;
        }

        const { error } = await this.supabase
            .from('funciones')
            .insert([funcion]);

        if (error) {
            console.error('Error al agregar funcion:', error.message);
            return false;
        }

        console.log('Nueva función agregada');
        return true;
    }

    async cargarTodasLasFunciones() {
        this.cargando.set(true);

        const { data, error } = await this.supabase
            .from('funciones')
            .select('*')
            .order('fecha', { ascending: true })
            .order('hora_inicio', { ascending: true });

        if (error) {
            console.error('Error al cargar funciones:', error.message);
            this.funciones.set([]);
        } else {
            this.funciones.set(data || []);
        }

        this.cargando.set(false);
    }

    async editarFuncion(id: string, cambios: Omit<Funcion, 'funciones_id'>): Promise<boolean> {

      const horarioValido = await this.validarHorario(cambios, id);

      if (!horarioValido) {
          return false;
      }

      const { data, error } = await this.supabase
          .from('funciones')
          .update(cambios)
          .eq('funciones_id', id)
          .select();

      if (error) {
          console.error('Error al editar funcion:', error.message);
          return false;
      }

      if (!data || data.length === 0) {
          console.error('La funcion no se actualizo. Revisar policies UPDATE de funciones.');
          return false;
      }

      console.log('Funcion actualizada:', data);
      return true;
    }

    async eliminarFuncion(id: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('funciones')
            .delete()
            .eq('funciones_id', id);

        if (error) {
            console.error('Error al eliminar funcion:', error.message);
            return false;
        }

        this.funciones.update(funciones => funciones.filter(f => f.funciones_id !== id));
        return true;
    }
}