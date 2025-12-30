import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AnalysisNameService {
  readonly analysisName = signal('Analyse vidéo');

  setAnalysisName(name: string) {
    this.analysisName.set(name);
  }
}
