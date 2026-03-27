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
    intro: 'Ces raccourcis vous permettent d’analyser une action sans casser votre concentration ni perdre du temps dans les menus.',
    sections: [
      {
        heading: 'Les actions utiles au quotidien',
        bullets: [
          'Lecture / pause rapide pour arrêter exactement au bon moment.',
          'Navigation plus précise pour revenir sur une séquence clé en quelques secondes.',
          'Analyse image par image pour vérifier un détail technique ou tactique.',
          'Ralenti et variation de vitesse pour mieux lire les déplacements et les timings.',
        ],
      },
      {
        heading: 'Ce que le composant vidéo vous apporte',
        paragraphs: [
          'Vous pouvez revoir plusieurs fois la même action, comparer deux passages et valider plus sereinement votre observation.',
          'L’objectif est simple : vous offrir un confort d’analyse fluide, même lors d’un débrief rapide après match ou entraînement.',
        ],
      },
      {
        paragraphs: [
          'Le lecteur est pensé pour rester compatible avec les usages vidéo courants, afin de démarrer rapidement sans complexifier votre routine.',
        ],
      },
    ],
  },
  'sequencer-overview': {
    title: 'Comprendre le panneau de séquençage',
    tags: ['Séquenceur', 'Observation', 'Suivi'],
    miniDescription: 'Structurez vos événements et labels pour garder une lecture claire du match.',
    intro: 'Le panneau de séquençage vous aide à organiser vos repères pour analyser avec méthode, pendant l’action puis au moment du bilan.',
    sections: [
      {
        heading: 'Trois notions simples',
        bullets: [
          'Event : un moment important que vous souhaitez repérer (exemple : tir, récupération, perte de balle).',
          'Label : une étiquette pour qualifier l’action (zone, intention, résultat, contexte).',
          'Stat : une synthèse pour suivre des tendances et appuyer vos décisions.',
        ],
      },
      {
        heading: 'Pourquoi c’est utile en pratique',
        bullets: [
          'Pendant l’analyse, vous capturez les informations au fil de la vidéo sans perdre le fil.',
          'Après l’analyse, vous retrouvez rapidement les passages clés pour préparer un retour clair à votre groupe.',
          'Vous gagnez du temps pour comparer, prioriser et partager les points qui comptent vraiment.',
        ],
      },
    ],
  },
  'timeline-overview': {
    title: 'Lire la timeline efficacement',
    tags: ['Timeline', 'Raccourcis', 'Préparation'],
    miniDescription: 'Situez chaque séquence dans le temps pour préparer des retours ciblés.',
    intro: 'La timeline vous donne une lecture chronologique claire du match ou de l’entraînement pour retrouver un passage en un instant.',
    sections: [
      {
        heading: 'Ce que vous pouvez faire rapidement',
        bullets: [
          'Visualiser les moments clés dans l’ordre où ils se produisent.',
          'Repérer une séquence importante et relancer une lecture ciblée.',
          'Naviguer facilement dans l’analyse pour comparer plusieurs situations.',
          'Sélectionner des événements pour construire un débrief plus structuré.',
        ],
      },
      {
        heading: 'Bénéfice au quotidien',
        paragraphs: [
          'Au lieu de chercher longtemps dans la vidéo, vous accédez directement aux passages utiles pour expliquer, corriger ou valoriser une action.',
          'Si des raccourcis de navigation sont activés, ils renforcent encore la fluidité pour passer d’une séquence à l’autre.',
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

