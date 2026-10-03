import { Component, input, output } from '@angular/core';
import { Candy } from '../../core/models/candyinterface';

@Component({
  selector: 'app-candy-card',
  imports: [],
  templateUrl: './candy-card.html',
  styleUrl: './candy-card.css',
})
export class CandyCard {

  candy = input.required<Candy>();

  cantidad: number = 0;

  cantidadCambiada = output<number>();

  sumar() {
    this.cantidad++;
    this.cantidadCambiada.emit(this.cantidad);
  }

  restar() {
    if (this.cantidad > 0) {
      this.cantidad--;
      this.cantidadCambiada.emit(this.cantidad);
    }
  }

}