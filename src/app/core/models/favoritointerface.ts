import { Pelicula } from './peliculainterface';

export interface Favorito {
  id?: string;
  user_id?: string;
  img_url?: string;
  pelicula_id: string;
  nota: string;
  peliculas?: Pelicula;
}