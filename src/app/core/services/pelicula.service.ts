import { Injectable, signal, computed, inject, DestroyRef } from "@angular/core";
import { SupabaseService } from './supabase.service';
import { Pelicula } from '../models/peliculainterface';
import { RealtimeChannel } from "@supabase/supabase-js";

@Injectable({ providedIn: 'root' })

export class PeliculaService {

    private supabase = inject(SupabaseService).client;
    private destroyRef = inject(DestroyRef);
    private peliculasSignal = signal<Pelicula[]>([]);
    private channel!: RealtimeChannel;
    cargando = signal(false);
    peliculas = computed(() => this.peliculasSignal());

    constructor() {
        this.cargarPeliculasdesdeDB();
        this.channel = this.iniciarRealTime();
        this.destroyRef.onDestroy(() => {
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
            .on(
                'postgres_changes',{ 
                    event: '*', 
                    schema: 'public', 
                    table: 'peliculas' },
                    (payload) => {
                    console.log('Cambio en tiempo real:', payload.eventType, payload);

                    switch (payload.eventType) {
                        case 'INSERT':
                            this.peliculasSignal.update(peliculas => [...peliculas, payload.new as Pelicula]);
                            break;

                        case 'UPDATE':
                            this.peliculasSignal.update(peliculas =>
                                peliculas.map(p => p.pelicula_id === (payload.new as Pelicula).pelicula_id ? payload.new as Pelicula : p)
                            );
                            break;

                        case 'DELETE':
                            this.peliculasSignal.update(peliculas =>
                                peliculas.filter(p => p.pelicula_id !== (payload.old as { pelicula_id: string }).pelicula_id)
                            );
                            break;
                    }
                }
            )
            .subscribe();
    }

    getPeliculasId(id: string) {
        return computed(() => this.peliculasSignal().find(pelicula => pelicula.pelicula_id === id));
    }

    async subirImagenPelicula(archivo: File): Promise<string | null> {
        const extension = archivo.name.split('.').pop();
        const nombreArchivo = `${crypto.randomUUID()}.${extension}`;
        const ruta = `peliculas/${nombreArchivo}`;

        const { error } = await this.supabase.storage
            .from('imagenes')
            .upload(ruta, archivo);

        if (error) {
            console.error('Error al subir imagen:', error.message);
            return null;
        }

        const { data } = this.supabase.storage
            .from('imagenes')
            .getPublicUrl(ruta);

        return data.publicUrl;
    }

    async borrarImagenPelicula(imgUrl: string): Promise<boolean> {
        const partes = imgUrl.split('/peliculas/');

        if (partes.length < 2) {
            console.error('No se pudo obtener la ruta de la imagen');
            return false;
        }

        const ruta = `peliculas/${partes[1]}`;

        const { error } = await this.supabase.storage
            .from('imagenes')
            .remove([ruta]);

        if (error) {
            console.error('Error al borrar imagen:', error.message);
            return false;
        }

        return true;
    }

    async agregarPelicula(pelicula: Omit<Pelicula, 'pelicula_id'>): Promise<boolean> {
        const { error } = await this.supabase
            .from('peliculas')
            .insert([{ ...pelicula }]);

        if (error) {
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

    async eliminarPelicula(id: string, imgUrl: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('peliculas')
            .delete()
            .eq('pelicula_id', id);

        if (error) {
            console.error('Error al eliminar pelicula:', error.message);
            return false;
        }

        await this.borrarImagenPelicula(imgUrl);
        return true;
    }

    async obtenerPeliculasMasVendidas(): Promise<Pelicula[]> {
        const { data, error } = await this.supabase.rpc('obtener_peliculas_mas_vendidas');

        if (error) {
            console.error('Error al obtener películas más vendidas:', error.message);
            return [];
        }

        const top3Ids = data.map((item: { pelicula_id: string; cantidad_vendida: number }) => item.pelicula_id);
        return top3Ids
            .map((id: string) => this.peliculasSignal().find((p: Pelicula) => p.pelicula_id === id))
            .filter((p: Pelicula | undefined): p is Pelicula => p !== undefined);
    }
}