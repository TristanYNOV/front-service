import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiUrlPolicyService {
  isAllowedApiUrl(url: string): boolean {
    if (!url) {
      return false;
    }

    // On limite explicitement aux préfixes API connus pour éviter toute fuite du bearer.
    if (!this.isAbsoluteUrl(url)) {
      return environment.apiAllowedPrefixes.some((prefix: string) => url.startsWith(prefix));
    }

    try {
      const parsed = new URL(url);
      const isSameOrigin = typeof window !== 'undefined' ? parsed.origin === window.location.origin : false;

      return isSameOrigin && environment.apiAllowedPrefixes.some((prefix: string) => parsed.pathname.startsWith(prefix));
    } catch {
      return false;
    }
  }

  private isAbsoluteUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }
}
