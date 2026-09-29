import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FavoritoService } from '../../core/services/favorito.service';
import { Favorito } from '../../core/models/favoritointerface';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-favoritos',
  styleUrl: './favoritos.css',
  templateUrl: './favoritos.html',
})
export class Favoritos implements OnInit{

  favoritosService = inject(FavoritoService);
  private fb = inject(FormBuilder);

  favoritos = this.favoritosService.favoritos;
  editandoId : string | null = null;
  notaControl = this.fb.control('',Validators.maxLength(200));

  ngOnInit(){
    this.favoritosService.cargarFavoritos()
  }

  eliminar(id:string){
    if(confirm('Estas seguro de que desea eliminar?')){
      this.favoritosService.eliminarFavorito(id)
    }
  }

  iniciarEdicion(fav:Favorito){
    this.editandoId = fav.id!;
    this.notaControl.setValue(fav.nota)
  }

  cancelarEdicion(){
    this.editandoId = null;
    this.notaControl.reset()
  }

  async guardarNota(id:string){
    if(this.notaControl.valid){
      await this.favoritosService.actualizarNota(id, this.notaControl.value || '')
    }
  }
}
