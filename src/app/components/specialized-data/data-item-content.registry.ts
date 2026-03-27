import { AnyDataItems, PriceTableData } from '../../interfaces/dataItem.interface';

export interface DataItemMeta {
  title: string;
  tags: string[];
  miniDescription?: string;
}

export interface TextBlockSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface TextBlockContent extends DataItemMeta {
  intro: string;
  sections?: TextBlockSection[];
}

const textContentRegistry: Record<string, TextBlockContent> = {
  'project-goal': {
    title: "Pourquoi ce projet existe",
    tags: ['Analyse vidéo', 'Sport', 'Débuter'],
    miniDescription: "Une analyse vidéo plus simple, pour tous les profils sportifs.",
    intro: 'Notre objectif est simple : rendre l’analyse vidéo accessible et utile au quotidien, sans complexité inutile.',
    sections: [
      {
        bullets: [
          'Observer plus vite les moments clés d’un match ou d’un entraînement.',
          'Partager des retours clairs avec le staff et les joueurs.',
          'Gagner du temps entre la préparation, l’observation et le suivi.',
        ],
      },
    ],
  },
  'ux-ui-workflow': {
    title: 'Comment fonctionne l’interface',
    tags: ['Interface', 'Mode édition', 'Productivité'],
    miniDescription: 'Repérez facilement les données en attente, sauvegardées et en édition.',
    intro: 'L’accueil est organisé pour vous aider à retrouver rapidement la bonne information au bon moment.',
    sections: [
      {
        heading: 'Les différents états utiles',
        bullets: [
          'Données en attente : informations liées à la page en cours, prêtes à être affichées.',
          'Données sauvegardées : éléments conservés pour les retrouver plus tard en un clic.',
          'Mode édition : personnalisez l’affichage selon votre manière de travailler.',
        ],
      },
    ],
  },
  'analysis-page-overview': {
    title: 'Découvrir la page Analyse',
    tags: ['Vidéo', 'Timeline', 'Séquenceur'],
    miniDescription: 'Vidéo, timeline et séquenceur travaillent ensemble pour guider votre analyse.',
    intro: 'La page Analyse est votre espace principal pour revoir une action, annoter et suivre vos séquences.',
    sections: [
      {
        bullets: [
          'Connexion requise : vos réglages et vos repères restent associés à votre compte.',
          'Composant vidéo : contrôlez la lecture et revenez précisément sur chaque phase.',
          'Timeline : visualisez le déroulé du match et les moments importants.',
          'Panneau de séquençage : classez et déclenchez rapidement vos actions d’analyse.',
        ],
      },
    ],
  },
  'video-shortcuts': {
    title: 'Raccourcis vidéo par défaut',
    tags: ['Vidéo', 'Raccourcis', 'Gain de temps'],
    miniDescription: 'Pilotez la lecture et l’exploration vidéo sans quitter votre clavier.',
    intro: 'Les raccourcis vidéo vous aident à analyser plus vite, surtout pendant une session intense.',
    sections: [
      {
        bullets: [
          'Lancer ou mettre en pause instantanément la lecture.',
          'Avancer ou reculer rapidement dans la séquence.',
          'Ajuster la vitesse et naviguer image par image pour plus de précision.',
        ],
      },
    ],
  },
  'sequencer-overview': {
    title: 'Comprendre le panneau de séquençage',
    tags: ['Séquenceur', 'Observation', 'Suivi'],
    miniDescription: 'Structurez vos événements et labels pour garder une lecture claire du match.',
    intro: 'Le séquenceur vous permet d’organiser vos repères pour suivre une logique d’analyse cohérente.',
    sections: [
      {
        bullets: [
          'Créez des repères adaptés à votre méthode et à votre sport.',
          'Déclenchez vos actions plus rapidement pendant l’observation.',
          'Conservez une base de travail claire pour le débrief et le suivi.',
        ],
      },
    ],
  },
  'timeline-overview': {
    title: 'Lire la timeline efficacement',
    tags: ['Timeline', 'Raccourcis', 'Préparation'],
    miniDescription: 'Situez chaque séquence dans le temps pour préparer des retours ciblés.',
    intro: 'La timeline donne une vision globale de votre analyse et vous aide à revenir immédiatement au bon moment.',
    sections: [
      {
        bullets: [
          'Repérez les temps forts et les enchaînements importants.',
          'Naviguez rapidement entre les périodes grâce aux repères temporels.',
          'Préparez des retours plus précis pour les séances suivantes.',
        ],
      },
    ],
  },
  'ffmpeg-installation': {
    title: 'Préparer l’installation de FFMPEG',
    tags: ['À venir', 'FFMPEG', 'Vidéo'],
    miniDescription: 'Un futur guide simple pour préparer votre machine aux traitements vidéo.',
    intro: 'Ce composant est prêt pour accueillir une aide pas à pas sur l’installation de FFMPEG.',
    sections: [
      {
        paragraphs: [
          'À terme, cela permettra d’exploiter davantage les fichiers vidéo en local, avec une expérience plus fluide.',
          'Le guide final restera orienté utilisateur, sans jargon technique.',
        ],
      },
    ],
  },
};

const fallbackTextContent: TextBlockContent = {
  title: 'Information',
  tags: ['Accueil'],
  miniDescription: 'Contenu de présentation.',
  intro: 'Retrouvez ici les informations importantes de la plateforme.',
};

const genericMeta: DataItemMeta = {
  title: 'Contenu',
  tags: ['Découverte'],
};

const priceMeta: DataItemMeta = {
  title: 'Tarifs de la plateforme',
  tags: ['Analyse vidéo', 'Abonnement', 'Club'],
  miniDescription: 'Comparez les offres et choisissez un niveau adapté à votre usage.',
};

export function getTextContent(itemId: string): TextBlockContent {
  return textContentRegistry[itemId] ?? fallbackTextContent;
}

export function getDataItemMeta(item: AnyDataItems): DataItemMeta {
  if (item.type === 'price') {
    return priceMeta;
  }

  if (item.type === 'text') {
    return getTextContent(item.id);
  }

  return genericMeta;
}

export function getMinPrice(planData: PriceTableData): number {
  return Math.min(...planData.plans.map(plan => plan.price));
}

