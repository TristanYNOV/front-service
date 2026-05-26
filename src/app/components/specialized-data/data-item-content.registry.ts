import { AnyDataItems, PriceTableData } from '../../interfaces/dataItem.interface';
import { RESERVED_VIDEO_HOTKEY_CHEATSHEET } from '../../core/services/hotkeys.service';

export type SupportedLang = 'fr' | 'en';

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

const fr = {
  fallback: { title: 'Information', tags: ['Accueil'], miniDescription: 'Contenu de présentation.', intro: 'Retrouvez ici les informations importantes de la plateforme.' },
  genericMeta: { title: 'Contenu', tags: ['Découverte'] },
  priceMeta: { title: 'Tarifs de la plateforme', tags: ['Analyse vidéo', 'Abonnement', 'Club'], miniDescription: 'Comparez les offres et choisissez un niveau adapté à votre usage.' },
  text: {
    'features-guide': {
      title: 'Guide utilisateur des fonctionnalités', tags: ['Fonctionnalités', 'Guide'], miniDescription: 'Un guide pour comprendre la page et afficher les composants utiles.',
      intro: 'Cette page présente les principales fonctionnalités d’Action Board et conserve la logique de composants affichables, minifiables et réutilisables.',
      sections: [{ heading: 'Comment explorer cette page', paragraphs: ['Les cartes affichées au centre expliquent les usages clés de la plateforme. Les composants disponibles dans la colonne de gauche peuvent être ouverts dans le canvas, puis sauvegardés ou retirés selon vos besoins.'] }]
    },
    'video-shortcuts': { title: 'Cheatsheet des raccourcis vidéo', tags: ['Vidéo', 'Raccourcis', 'Clavier'], miniDescription: 'Les raccourcis vidéo réservés réellement configurés dans le service de hotkeys.', intro: 'Ces raccourcis viennent de la configuration existante du service de hotkeys et servent à contrôler la vidéo pendant l’analyse.', sections: [{ heading: 'Raccourcis configurés', bullets: RESERVED_VIDEO_HOTKEY_CHEATSHEET.map(e => `${e.shortcut} : ${e.label}.`) }] },
    'video-analysis-how-it-works': { title: 'Comment fonctionne l’analyse vidéo ?', tags: ['Analyse vidéo', 'Timeline', 'Panneau'], miniDescription: 'Les trois éléments principaux : panneau d’analyse, vidéo et timeline.', intro: 'L’analyse vidéo dans Action Board repose sur trois éléments complémentaires : le panneau d’analyse, la vidéo et la timeline.' },
    'analysis-panel-how-it-works': { title: 'Comment fonctionne un panneau d’analyse ?', tags: ['Panneau', 'Événement', 'Label', 'Stats'], miniDescription: 'Comprendre les boutons événement, label et stats d’un panneau personnalisé.', intro: 'Un panneau d’analyse personnalisé accélère l’observation en regroupant les actions utiles à votre méthode de travail.' },
    'save-and-share-how-it-works': { title: 'Comment sauvegarder mes analyses et mes panneaux ?', tags: ['Sauvegarde', 'Import/export', 'Confidentialité'], miniDescription: 'Sauvegarde en ligne, visibilité des panneaux et confidentialité des timelines.', intro: 'Action Board permet de retrouver son travail en ligne grâce à la sauvegarde des panneaux et timelines, ainsi qu’à l’import/export.' },
    'project-goal': { title: 'Pourquoi ce projet existe', tags: ['Analyse vidéo', 'Sport', 'Débuter'], miniDescription: 'Une analyse vidéo plus simple, pour tous les profils sportifs.', intro: 'Notre objectif est simple : rendre l’analyse vidéo accessible et utile au quotidien, sans complexité inutile.' },
    'ux-ui-workflow': { title: 'Comment fonctionne l’interface', tags: ['Interface', 'Mode édition', 'Productivité'], miniDescription: 'Repérez facilement les données en attente, sauvegardées et en édition.', intro: 'L’accueil est organisé pour vous aider à retrouver rapidement la bonne information au bon moment.' },
    'analysis-page-overview': { title: 'Découvrir la page Analyse', tags: ['Vidéo', 'Timeline', 'Séquenceur'], miniDescription: 'Vidéo, timeline et séquenceur travaillent ensemble pour guider votre analyse.', intro: 'La page Analyse est votre espace principal pour revoir une action, annoter et suivre vos séquences.' },
    'legacy-video-shortcuts': { title: 'Raccourcis vidéo par défaut', tags: ['Vidéo', 'Raccourcis', 'Gain de temps'], miniDescription: 'Pilotez la lecture et l’exploration vidéo sans quitter votre clavier.', intro: 'Ces raccourcis vous permettent d’analyser une action sans casser votre concentration ni perdre du temps dans les menus.' },
    'sequencer-overview': { title: 'Comprendre le panneau de séquençage', tags: ['Séquenceur', 'Observation', 'Suivi'], miniDescription: 'Structurez vos événements et labels pour garder une lecture claire du match.', intro: 'Le panneau de séquençage vous aide à organiser vos repères pour analyser avec méthode, pendant l’action puis au moment du bilan.' },
    'timeline-overview': { title: 'Lire la timeline efficacement', tags: ['Timeline', 'Raccourcis', 'Préparation'], miniDescription: 'Situez chaque séquence dans le temps pour préparer des retours ciblés.', intro: 'La timeline vous donne une lecture chronologique claire du match ou de l’entraînement pour retrouver un passage en un instant.' },
    'ffmpeg-installation': { title: 'Préparer l’installation de FFMPEG', tags: ['À venir', 'FFMPEG', 'Vidéo'], miniDescription: 'Un futur guide simple pour préparer votre machine aux traitements vidéo.', intro: 'Ce composant est prêt pour accueillir une aide pas à pas sur l’installation de FFMPEG.' },
  } as Record<string, TextBlockContent>,
};

const en = {
  fallback: { title: 'Information', tags: ['Home'], miniDescription: 'Presentation content.', intro: 'Find key platform information here.' },
  genericMeta: { title: 'Content', tags: ['Discovery'] },
  priceMeta: { title: 'Platform pricing', tags: ['Video analysis', 'Subscription', 'Club'], miniDescription: 'Compare plans and choose what fits your usage.' },
  text: Object.fromEntries(Object.entries(fr.text).map(([k,v]) => [k, { ...v, tags: v.tags.map(t => t) }])) as Record<string, TextBlockContent>,
};

function dict(lang: SupportedLang) { return lang === 'en' ? en : fr; }

export function getTextContent(itemId: string, lang: SupportedLang): TextBlockContent {
  return dict(lang).text[itemId] ?? dict(lang).fallback;
}

export function getDataItemMeta(item: AnyDataItems, lang: SupportedLang): DataItemMeta {
  const d = dict(lang);
  if (item.type === 'price') return d.priceMeta;
  if (item.type === 'text') return getTextContent(item.id, lang);
  return d.genericMeta;
}

export function getMinPrice(planData: PriceTableData): number {
  return Math.min(...planData.plans.map(plan => plan.price));
}
