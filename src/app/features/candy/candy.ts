import { Component, inject } from '@angular/core';
import { CandyService } from '../../core/services/candy.service';
import { CandyCard } from '../../shares/candy-card/candy-card';

@Component({
  imports: [CandyCard],
  selector: 'app-candy',
  styleUrl: './candy.css',
  templateUrl: './candy.html',
})
export class Candy {

  candyService = inject(CandyService);

  candy = this.candyService.candy
}
