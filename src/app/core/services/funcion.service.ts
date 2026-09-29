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
}