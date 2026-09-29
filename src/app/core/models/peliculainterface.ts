export interface Pelicula{
    pelicula_id: string;
    pelicula_titulo: string;
    sinopsis: string;
    img_url: string;
    edad_restriccion: string;
    genero: string[];
    duracion: number;
    disponible: boolean;
    estado: string
}