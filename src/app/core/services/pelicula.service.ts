import { Injectable, signal, computed, inject, DestroyRef } from "@angular/core";
import { SupabaseService } from './supabase.service';
import { Pelicula } from '../models/peliculainterface';
import { RealtimeChannel } from "@supabase/supabase-js";

@Injectable({ providedIn: 'root' })
export class PeliculaService{
    private supabase = inject(SupabaseService).client;
    private destroyRef = inject(DestroyRef);

    private peliculasSignal = signal<Pelicula[]>([]);

    cargando = signal(false);

    peliculas = computed(() => this.peliculasSignal());

    private channel! : RealtimeChannel;

    constructor() {
        this.cargarPeliculasdesdeDB();

        this.channel = this.iniciarRealTime();

        this.destroyRef.onDestroy(() =>{
            this.supabase.removeChannel(this.channel);
        });
    }

    private async cargarPeliculasdesdeDB(): Promise<void> {

    this.cargando.set(true);

    const { data, error } = await this.supabase
        .from('peliculas')
        .select('*');

    console.log('DATOS:', data);
    console.log('ERROR:', error);

    if (error) {
        console.error('Error al cargar peliculas:', error.message);
    } else {
        this.peliculasSignal.set(data || []);
    }

    this.cargando.set(false);
}

    private iniciarRealTime(): RealtimeChannel {
        return this.supabase
            .channel('peliculas-realtime')
            .on('postgres_changes',
                {event: '*', schema: 'public', table: 'peliculas'},
                (payload) => {
                    console.log('Cambio en tiempo real:', payload.eventType, payload);

                    switch (payload.eventType) {
                        case 'INSERT':
                            this.peliculasSignal.update(peliculas =>[...peliculas, payload.new as Pelicula]);
                            break;

                        case 'UPDATE':
                            this.peliculasSignal.update(peliculas =>
                            peliculas.map(p => p.pelicula_id === (payload.new as Pelicula).pelicula_id? payload.new as Pelicula : p)
                            );  
                            break;

                        case 'DELETE':
                            this.peliculasSignal.update(peliculas =>
                            peliculas.filter(p => p.pelicula_id !== (payload.old as {pelicula_id: string}).pelicula_id)
                            );  
                            break;
                    }
                }
            )
            .subscribe();
        }

    getPeliculasId(id: string){
        return computed(() => this.peliculasSignal().find(peliculas => peliculas.pelicula_id === id));
        }
    
    async agregarPelicula(pelicula: Omit<Pelicula, 'pelicula_id'>): Promise<boolean> {
        const {error} = await this.supabase
            .from('peliculas')
            .insert([{...pelicula}]);

        if (error){
            console.error('Error al agregar pelicula:', error.message);
            return false;
        }

        console.log(`Nueva pelicula Agregada: "${pelicula.pelicula_titulo}"`);
        return true;
    }

    async editarPelicula(id: string, cambios: Omit<Pelicula, 'pelicula_id'>): Promise<boolean> {
    const { error } = await this.supabase
        .from('peliculas')
        .update(cambios)
        .eq('pelicula_id', id);

    if (error) {
        console.error('Error al editar pelicula:', error.message);
        return false;
    }
    return true;
    }
}
