import { AnyDataItems, PriceTableData } from '../../interfaces/dataItem.interface';
import { RESERVED_VIDEO_HOTKEY_CHEATSHEET } from '../../core/services/hotkeys.service';

export interface DataItemMeta {
  title: string;
  tags: string[];
  miniDescription?: string;
}

export interface TextBlockSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  iconTips?: { icon: string; label: string; description: string }[];
}

export interface TextBlockContent extends DataItemMeta {
  intro: string;
  sections?: TextBlockSection[];
}

const textContentRegistry: Record<string, TextBlockContent> = {
  'features-guide': {
    title: 'Guide utilisateur des fonctionnalités',
    tags: ['Fonctionnalités', 'Guide'],
    miniDescription: 'Un guide pour comprendre la page et afficher les composants utiles.',
    intro:
      'Cette page présente les principales fonctionnalités d’Action Board et conserve la logique de composants affichables, minifiables et réutilisables.',
    sections: [
      {
        heading: 'Comment explorer cette page',
        paragraphs: [
          'Les cartes affichées au centre expliquent les usages clés de la plateforme. Les composants disponibles dans la colonne de gauche peuvent être ouverts dans le canvas, puis sauvegardés ou retirés selon vos besoins.',
        ],
        iconTips: [
          {
            icon: 'cloud',
            label: 'Composants disponibles',
            description: 'Ouvre un contenu minifié dans le canvas principal.',
          },
          {
            icon: 'bookmark',
            label: 'Composants sauvegardés',
            description: 'Retrouve un contenu conservé pour le réafficher plus tard.',
          },
          {
            icon: 'save',
            label: 'Sauvegarder',
            description: 'Minifie un composant affiché pour le garder dans la zone sauvegardée.',
          },
          {
            icon: 'delete',
            label: 'Minifier',
            description: 'Retire le composant du canvas sans supprimer la ressource applicative.',
          },
          {
            icon: 'lock_open',
            label: 'Mode édition',
            description: 'Déverrouille le layout pour déplacer et redimensionner les composants.',
          },
        ],
      },
      {
        heading: 'Ce que vous allez découvrir',
        bullets: [
          'Le fonctionnement général de l’analyse vidéo avec panneau, vidéo et timeline.',
          'Les boutons événement, label et stats qui structurent les observations.',
          'La sauvegarde en ligne, l’import/export et les différences entre panneaux publics, panneaux privés et timelines privées.',
        ],
      },
      {
        heading: 'Pages publiques liées',
        paragraphs: [
          'Pour compléter cette présentation, consultez les pages Tarifs, FAQ, Contact, CGU et Confidentialité accessibles depuis la navigation principale.',
        ],
      },
    ],
  },
  'video-shortcuts': {
    title: 'Cheatsheet des raccourcis vidéo',
    tags: ['Vidéo', 'Raccourcis', 'Clavier'],
    miniDescription: 'Les raccourcis vidéo réservés réellement configurés dans le service de hotkeys.',
    intro:
      'Ces raccourcis viennent de la configuration existante du service de hotkeys et servent à contrôler la vidéo pendant l’analyse.',
    sections: [
      {
        heading: 'Raccourcis configurés',
        bullets: RESERVED_VIDEO_HOTKEY_CHEATSHEET.map(entry => `${entry.shortcut} : ${entry.label}.`),
      },
      {
        heading: 'Pourquoi les utiliser',
        paragraphs: [
          'Ils permettent de rester concentré sur l’observation, de revenir précisément sur une action et d’ajuster la vitesse sans quitter le clavier.',
        ],
      },
    ],
  },
  'video-analysis-how-it-works': {
    title: 'Comment fonctionne l’analyse vidéo ?',
    tags: ['Analyse vidéo', 'Timeline', 'Panneau'],
    miniDescription: 'Les trois éléments principaux : panneau d’analyse, vidéo et timeline.',
    intro:
      'L’analyse vidéo dans Action Board repose sur trois éléments complémentaires : le panneau d’analyse, la vidéo et la timeline.',
    sections: [
      {
        bullets: [
          'Panneau d’analyse : il regroupe les boutons qui déclenchent ou qualifient les observations.',
          'Vidéo : elle peut être contrôlée avec les raccourcis et les commandes de lecture.',
          'Timeline : elle structure les occurrences créées pendant l’analyse pour retrouver les moments importants.',
        ],
      },
      {
        paragraphs: [
          'Pendant la lecture, l’utilisateur peut contrôler la vidéo, déclencher des boutons d’analyse et produire des informations structurées dans la timeline.',
        ],
      },
    ],
  },
  'analysis-panel-how-it-works': {
    title: 'Comment fonctionne un panneau d’analyse ?',
    tags: ['Panneau', 'Événement', 'Label', 'Stats'],
    miniDescription: 'Comprendre les boutons événement, label et stats d’un panneau personnalisé.',
    intro:
      'Un panneau d’analyse personnalisé accélère l’observation en regroupant les actions utiles à votre méthode de travail.',
    sections: [
      {
        heading: 'Les types de boutons',
        bullets: [
          'Événement : génère des occurrences dans la timeline.',
          'Label : définit ou qualifie une occurrence.',
          'Stats : produit des statistiques pendant l’analyse.',
        ],
      },
      {
        heading: 'Accélérer l’analyse',
        paragraphs: [
          'Les hotkeys et les liens d’activation permettent de déclencher plus vite les actions répétitives. Un panneau adapté à votre sport peut réduire le temps passé à chercher, qualifier et compter les situations importantes.',
          'Des panneaux publics peuvent être réutilisés par d’autres utilisateurs connectés. Une documentation détaillée pourra être ajoutée ultérieurement.',
        ],
      },
    ],
  },
  'save-and-share-how-it-works': {
    title: 'Comment sauvegarder mes analyses et mes panneaux ?',
    tags: ['Sauvegarde', 'Import/export', 'Confidentialité'],
    miniDescription: 'Sauvegarde en ligne, visibilité des panneaux et confidentialité des timelines.',
    intro:
      'Action Board permet de retrouver son travail en ligne grâce à la sauvegarde des panneaux et timelines, ainsi qu’à l’import/export.',
    sections: [
      {
        heading: 'Panneaux',
        bullets: [
          'Un panneau peut être sauvegardé en ligne.',
          'Un panneau peut être privé ou public.',
          'Les panneaux publics sont visibles uniquement par des utilisateurs connectés.',
          'Les panneaux peuvent être importés ou exportés.',
        ],
      },
      {
        heading: 'Timelines',
        bullets: [
          'Une timeline sauvegardée reste toujours privée.',
          'Aucune timeline publique n’est possible.',
          'Les timelines peuvent être importées ou exportées.',
          'Les timelines sont visibles uniquement par leur utilisateur propriétaire.',
        ],
      },
    ],
  },
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
  'legacy-video-shortcuts': {
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

