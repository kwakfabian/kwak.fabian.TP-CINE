import { Component, inject, input } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Candy } from '../../core/models/candyinterface';

@Component({
  imports: [],
  selector: 'app-candy-card',
  styleUrl: './candy-card.css',
  templateUrl: './candy-card.html',
})
export class CandyCard {
  authService = inject(AuthService);
  
  candy = input.required<Candy>();

}
