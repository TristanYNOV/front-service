import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  /** Signal permettant d'afficher ou non le tutoriel de démarrage */
  readonly showTutorial = signal(false);

  toggleTutorial(): void {
    this.showTutorial.update(v => !v);
  }
}
