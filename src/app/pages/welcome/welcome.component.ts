import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthSessionService } from '../../core/auth/auth-session.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
  imports: [
    RouterLink
  ]
})
export class WelcomeComponent {
  private readonly authSession = inject(AuthSessionService);

  protected readonly welcomePseudo = computed(() => this.authSession.user()?.pseudo ?? 'coach');
}
