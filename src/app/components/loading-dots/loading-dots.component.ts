import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-dots',
  standalone: true,
  template: `
    <span class="flex items-center space-x-1">
      <span class="dot w-2 h-2 bg-[currentColor] rounded-full"></span>
      <span class="dot w-2 h-2 bg-[currentColor] rounded-full"></span>
      <span class="dot w-2 h-2 bg-[currentColor] rounded-full"></span>
    </span>
  `,
  styles: [
    `
    .dot {
      animation: loading-dots 1.4s infinite both;
    }
    .dot:nth-child(1) {
      animation-delay: -0.32s;
    }
    .dot:nth-child(2) {
      animation-delay: -0.16s;
    }
    @keyframes loading-dots {
      0%, 80%, 100% { opacity: 0; }
      40% { opacity: 1; }
    }
    `,
  ],
})
export class LoadingDotsComponent {}

