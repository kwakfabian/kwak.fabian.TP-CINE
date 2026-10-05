export interface Resena {
    resena_id?: string;
    usuario_id: string;
    pelicula_id: string;
    estrellas: number;
    comentario: string;
    fecha_creacion?: string;
}