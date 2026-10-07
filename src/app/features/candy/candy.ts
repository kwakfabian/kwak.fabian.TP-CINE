import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CandyService } from '../../core/services/candy.service';
import { CompraService } from '../../core/services/compra.service';
import { CandyCard } from '../../shares/candy-card/candy-card';

@Component({
  imports: [CandyCard],
  selector: 'app-candy',
  styleUrl: './candy.css',
  templateUrl: './candy.html',
})
export class Candy {

  candyService = inject(CandyService);
  compraService = inject(CompraService);
  router = inject(Router);
  candy = this.candyService.candy;

  cantidades: {
    candy_id: string;
    cantidad: number;
    }[] = [];

  cambiarCantidad(candyId: string, cantidad: number): void {

    const productoExistente = this.cantidades.find(
      item => item.candy_id === candyId
    );

    if (productoExistente) {
      productoExistente.cantidad = cantidad;

    } else {

      this.cantidades.push({
        candy_id: candyId,
        cantidad: cantidad
      });

    }

  }

  continuar(): void {

    const candySeleccionado = this.cantidades
      .filter(item => item.cantidad > 0)
      .map(item => {

        const producto = this.candy().find(candy => candy.candy_id === item.candy_id);
      
        return {
          candy_id: item.candy_id,
          nombre_candy: producto!.nombre_candy,
          cantidad: item.cantidad,
          precio: producto!.precio
        };

      });

    this.compraService.setearCandy(candySeleccionado);

    this.router.navigate(['/confirmar-compra']);

  }

}