import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { filter } from 'rxjs';

export type SeoPageKey =
  | 'home'
  | 'features'
  | 'pricing'
  | 'faq'
  | 'contact'
  | 'terms'
  | 'privacy'
  | 'private'
  | 'notFound';

export interface SeoPageConfig {
  title: string;
  description: string;
  path: string;
  robots?: string;
  jsonLd?: unknown[];
}

const SITE_URL = 'https://app.actionboard.fr';
const DEFAULT_TITLE = 'Action Board - Plateforme d’analyse vidéo sportive';
const DEFAULT_DESCRIPTION =
  'Action Board aide les coachs, clubs, analystes et étudiants à rendre l’analyse vidéo sportive plus accessible grâce aux panneaux d’analyse, timelines et statistiques.';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Action Board',
  url: SITE_URL,
};

const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Action Board',
  url: SITE_URL,
  description: 'Plateforme d’analyse vidéo sportive',
};

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Action Board',
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  description:
    'Action Board est une plateforme web d’analyse vidéo sportive destinée aux coachs, clubs, analystes vidéo et étudiants.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
  },
};

export const FAQ_ITEMS = [
  {
    question: 'Qu’est-ce qu’Action Board ?',
    answer:
      'Action Board est une plateforme d’analyse vidéo sportive qui aide à créer des panneaux d’analyse, annoter une vidéo avec une timeline et suivre des statistiques pendant l’observation.',
  },
  {
    question: 'À qui s’adresse la plateforme ?',
    answer:
      'La plateforme s’adresse aux coachs amateurs, clubs amateurs, analystes vidéo indépendants ou rattachés à un club, ainsi qu’aux étudiants.',
  },
  {
    question: 'Quels sports sont compatibles ?',
    answer:
      'Action Board vise toutes les pratiques sportives. Les panneaux peuvent être adaptés aux besoins d’un sport, d’une équipe ou d’une méthode d’analyse.',
  },
  {
    question: 'Faut-il être connecté pour utiliser les panneaux publics ?',
    answer:
      'Oui. Les panneaux publics peuvent être retrouvés et réutilisés par des utilisateurs connectés.',
  },
  {
    question: 'Les timelines peuvent-elles être publiques ?',
    answer:
      'Non. Les timelines sont privées et visibles uniquement par leur utilisateur propriétaire.',
  },
  {
    question: 'Qu’est-ce qu’un panneau d’analyse ?',
    answer:
      'Un panneau d’analyse est un ensemble de boutons personnalisés qui sert à déclencher des événements, appliquer des labels et produire des statistiques pendant l’analyse vidéo.',
  },
  {
    question: 'Qu’est-ce qu’un bouton événement ?',
    answer:
      'Un bouton événement sert à créer des occurrences dans la timeline, par exemple pour repérer une action importante.',
  },
  {
    question: 'Qu’est-ce qu’un bouton label ?',
    answer:
      'Un bouton label sert à qualifier une occurrence avec un contexte, une zone, un résultat ou toute information utile à l’analyse.',
  },
  {
    question: 'Qu’est-ce qu’un bouton stats ?',
    answer:
      'Un bouton stats permet de produire des statistiques pendant l’analyse à partir des événements et labels configurés.',
  },
  {
    question: 'Est-ce que la plateforme est gratuite ?',
    answer:
      'Oui. Action Board est actuellement gratuit pour les utilisateurs disposant d’un compte.',
  },
  {
    question: 'Que se passe-t-il lors de la suppression d’un compte ?',
    answer:
      'La suppression du compte supprime les analyses et panneaux privés selon la logique existante. Les panneaux publics peuvent être conservés sous forme anonymisée.',
  },
  {
    question: 'Les données publiques sont-elles anonymisées ?',
    answer:
      'Les panneaux publics peuvent être conservés sous forme anonymisée après suppression du compte afin de préserver les ressources partagées avec la communauté.',
  },
  {
    question: 'Peut-on importer/exporter des panneaux ?',
    answer:
      'Oui. Action Board permet d’importer et d’exporter des panneaux pour retrouver ou partager une structure d’analyse.',
  },
  {
    question: 'Peut-on importer/exporter des timelines ?',
    answer:
      'Oui. Les timelines peuvent être importées et exportées, mais elles restent privées et liées à leur utilisateur propriétaire.',
  },
] as const;

function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

const publicJsonLd = [organizationJsonLd, webSiteJsonLd, softwareApplicationJsonLd];

export const SEO_PAGES: Record<SeoPageKey, SeoPageConfig> = {
  home: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: '/',
    jsonLd: publicJsonLd,
  },
  features: {
    title: 'Fonctionnalités - Action Board',
    description:
      'Découvrez les fonctionnalités d’Action Board : analyse vidéo, panneaux personnalisés, timeline, raccourcis clavier, statistiques, sauvegarde et import/export.',
    path: '/fonctionnalites',
    jsonLd: publicJsonLd,
  },
  pricing: {
    title: 'Tarifs - Action Board',
    description: 'Action Board est actuellement gratuit pour les utilisateurs disposant d’un compte.',
    path: '/tarifs',
    jsonLd: publicJsonLd,
  },
  faq: {
    title: 'FAQ - Action Board',
    description:
      'Questions fréquentes sur Action Board, la plateforme d’analyse vidéo sportive pour coachs, clubs, analystes et étudiants.',
    path: '/faq',
    jsonLd: [...publicJsonLd, faqJsonLd()],
  },
  contact: {
    title: 'Contact - Action Board',
    description: 'Contactez l’équipe Action Board pour toute question sur la plateforme d’analyse vidéo sportive.',
    path: '/contact',
    jsonLd: publicJsonLd,
  },
  terms: {
    title: 'Conditions Générales d’Utilisation - Action Board',
    description: 'Consultez les conditions générales d’utilisation temporaires de la plateforme Action Board.',
    path: '/cgu',
    jsonLd: publicJsonLd,
  },
  privacy: {
    title: 'Confidentialité - Action Board',
    description:
      'Découvrez comment Action Board gère les comptes, panneaux, timelines, données privées et anonymisation.',
    path: '/confidentialite',
    jsonLd: publicJsonLd,
  },
  private: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: '/',
    robots: 'noindex,nofollow',
  },
  notFound: {
    title: 'Page introuvable - Action Board',
    description: 'La page demandée est introuvable sur Action Board.',
    path: '/',
    robots: 'noindex,nofollow',
  },
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  initRouteTracking(): void {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe(() => {
      const seoKey = this.resolveSeoKey(this.router.routerState.snapshot.root);
      this.applyPage(seoKey);
    });
  }

  applyPage(key: SeoPageKey): void {
    const page = SEO_PAGES[key] ?? SEO_PAGES.home;
    const url = `${SITE_URL}${page.path}`;
    const robots = page.robots ?? 'index,follow';

    this.title.setTitle(page.title);
    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({ name: 'robots', content: robots });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Action Board' });
    this.meta.updateTag({ property: 'og:title', content: page.title });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: page.title });
    this.meta.updateTag({ name: 'twitter:description', content: page.description });
    this.setCanonical(url);
    this.setJsonLd(page.jsonLd ?? []);
  }

  private resolveSeoKey(route: ActivatedRouteSnapshot): SeoPageKey {
    let current: ActivatedRouteSnapshot | null = route;
    let key: SeoPageKey | undefined;

    while (current) {
      if (current.data?.['seoKey']) {
        key = current.data['seoKey'] as SeoPageKey;
      }
      current = current.firstChild ?? null;
    }

    return key ?? 'notFound';
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(blocks: unknown[]): void {
    Array.from(this.document.querySelectorAll('script[data-seo-json-ld="true"]')).forEach(node => node.remove());

    blocks.forEach(block => {
      const script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-json-ld', 'true');
      script.textContent = JSON.stringify(block);
      this.document.head.appendChild(script);
    });
  }
}
