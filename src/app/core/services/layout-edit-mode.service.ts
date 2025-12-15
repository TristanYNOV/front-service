import { Injectable, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

const STORAGE_KEY = 'layoutEditMode';

@Injectable({ providedIn: 'root' })
export class LayoutEditModeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly editMode = signal(false);

  readonly isEditMode = this.editMode.asReadonly();

  constructor() {
    this.loadInitialState();
  }

  toggle(): void {
    this.setMode(!this.editMode());
  }

  setEdit(): void {
    this.setMode(true);
  }

  setLocked(): void {
    this.setMode(false);
  }

  private setMode(value: boolean): void {
    this.editMode.set(value);
    this.persistState(value);
  }

  private loadInitialState(): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        this.editMode.set(stored === 'true');
      }
    } catch (error) {
      console.error('Failed to load layout edit mode from storage', error);
    }
  }

  private persistState(value: boolean): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch (error) {
      console.error('Failed to persist layout edit mode to storage', error);
    }
  }
}
