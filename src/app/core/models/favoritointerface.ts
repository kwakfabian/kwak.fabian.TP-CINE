import { Pelicula } from './peliculainterface';

export interface Favorito {
  id?: string;
  user_id?: string;
  pelicula_id: string;
  nota: string;
  pelicula?: Pelicula;
}