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

  async agregarFuncion(funcion: Omit<Funcion, 'funciones_id'>): Promise<boolean> {
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
      const { error } = await this.supabase
          .from('funciones')
          .update(cambios)
          .eq('funciones_id', id);

      if (error) {
          console.error('Error al editar funcion:', error.message);
          return false;
        }
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