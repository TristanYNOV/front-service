import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  standalone: true,
  imports: [
    RouterLink
  ]
})
export class LandingComponent {

}
