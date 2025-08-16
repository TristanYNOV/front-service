import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-dots',
  standalone: true,
  template: `
    <div class="flex space-x-1 items-center justify-center">
      @for (dot of dots; track dot) {
        <span class="dot"></span>
      }
    </div>
  `,
  styles: [`
    .dot {
      width: 0.5rem;
      height: 0.5rem;
      background-color: currentColor;
      border-radius: 50%;
      animation: blink 1.4s infinite both;
    }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink {
      0%, 80%, 100% { opacity: 0; }
      40% { opacity: 1; }
    }
  `]
})
export class LoadingDotsComponent {
  protected readonly dots = [1, 2, 3];
}