import { AnyDataItems, PriceTableData } from '../../interfaces/dataItem.interface';

export interface DataItemMeta {
  titleKey: string;
  tagsKeys: string[];
  miniDescriptionKey?: string;
}

export interface TextBlockSection {
  headingKey?: string;
  paragraphKeys?: string[];
  bulletKeys?: string[];
  iconTips?: { icon: string; labelKey: string; descriptionKey: string }[];
}

export interface TextBlockContent extends DataItemMeta {
  introKey: string;
  sections?: TextBlockSection[];
}

const textContentRegistry: Record<string, TextBlockContent> = {
  'features-guide': {
    titleKey: 'dataItems.featuresGuide.title',
    tagsKeys: ['dataItems.tags.features', 'dataItems.tags.guide'],
    miniDescriptionKey: 'dataItems.featuresGuide.miniDescription',
    introKey: 'dataItems.featuresGuide.intro',
    sections: [
      {
        headingKey: 'dataItems.featuresGuide.sections.explore.heading',
        paragraphKeys: ['dataItems.featuresGuide.sections.explore.paragraphs.0'],
        iconTips: ['cloud', 'bookmark', 'save', 'delete', 'lock_open'].map((icon, index) => ({
          icon,
          labelKey: `dataItems.featuresGuide.sections.explore.iconTips.${index}.label`,
          descriptionKey: `dataItems.featuresGuide.sections.explore.iconTips.${index}.description`,
        })),
      },
      {
        headingKey: 'dataItems.featuresGuide.sections.discover.heading',
        bulletKeys: [
          'dataItems.featuresGuide.sections.discover.bullets.0',
          'dataItems.featuresGuide.sections.discover.bullets.1',
          'dataItems.featuresGuide.sections.discover.bullets.2',
        ],
      },
      {
        headingKey: 'dataItems.featuresGuide.sections.related.heading',
        paragraphKeys: ['dataItems.featuresGuide.sections.related.paragraphs.0'],
      },
    ],
  },
  'video-shortcuts': {
    titleKey: 'dataItems.videoShortcuts.title',
    tagsKeys: ['dataItems.tags.video', 'dataItems.tags.shortcuts', 'dataItems.tags.keyboard'],
    miniDescriptionKey: 'dataItems.videoShortcuts.miniDescription',
    introKey: 'dataItems.videoShortcuts.intro',
    sections: [
      {
        headingKey: 'dataItems.videoShortcuts.sections.configured.heading',
        bulletKeys: [
          'dataItems.videoShortcuts.sections.configured.bullets.0',
          'dataItems.videoShortcuts.sections.configured.bullets.1',
          'dataItems.videoShortcuts.sections.configured.bullets.2',
          'dataItems.videoShortcuts.sections.configured.bullets.3',
          'dataItems.videoShortcuts.sections.configured.bullets.4',
          'dataItems.videoShortcuts.sections.configured.bullets.5',
          'dataItems.videoShortcuts.sections.configured.bullets.6',
        ],
      },
      {
        headingKey: 'dataItems.videoShortcuts.sections.why.heading',
        paragraphKeys: ['dataItems.videoShortcuts.sections.why.paragraphs.0'],
      },
    ],
  },
  'video-analysis-how-it-works': {
    titleKey: 'dataItems.videoAnalysis.title',
    tagsKeys: ['dataItems.tags.videoAnalysis', 'dataItems.tags.timeline', 'dataItems.tags.panel'],
    miniDescriptionKey: 'dataItems.videoAnalysis.miniDescription',
    introKey: 'dataItems.videoAnalysis.intro',
    sections: [
      {
        bulletKeys: [
          'dataItems.videoAnalysis.sections.core.bullets.0',
          'dataItems.videoAnalysis.sections.core.bullets.1',
          'dataItems.videoAnalysis.sections.core.bullets.2',
        ],
      },
      {
        paragraphKeys: ['dataItems.videoAnalysis.sections.workflow.paragraphs.0'],
      },
    ],
  },
  'analysis-panel-how-it-works': {
    titleKey: 'dataItems.analysisPanel.title',
    tagsKeys: ['dataItems.tags.panel', 'dataItems.tags.event', 'dataItems.tags.label', 'dataItems.tags.stats'],
    miniDescriptionKey: 'dataItems.analysisPanel.miniDescription',
    introKey: 'dataItems.analysisPanel.intro',
    sections: [
      {
        headingKey: 'dataItems.analysisPanel.sections.types.heading',
        bulletKeys: [
          'dataItems.analysisPanel.sections.types.bullets.0',
          'dataItems.analysisPanel.sections.types.bullets.1',
          'dataItems.analysisPanel.sections.types.bullets.2',
        ],
      },
      {
        headingKey: 'dataItems.analysisPanel.sections.speed.heading',
        paragraphKeys: [
          'dataItems.analysisPanel.sections.speed.paragraphs.0',
          'dataItems.analysisPanel.sections.speed.paragraphs.1',
        ],
      },
    ],
  },
  'save-and-share-how-it-works': {
    titleKey: 'dataItems.saveShare.title',
    tagsKeys: ['dataItems.tags.save', 'dataItems.tags.importExport', 'dataItems.tags.privacy'],
    miniDescriptionKey: 'dataItems.saveShare.miniDescription',
    introKey: 'dataItems.saveShare.intro',
    sections: [
      {
        headingKey: 'dataItems.saveShare.sections.panels.heading',
        bulletKeys: [
          'dataItems.saveShare.sections.panels.bullets.0',
          'dataItems.saveShare.sections.panels.bullets.1',
          'dataItems.saveShare.sections.panels.bullets.2',
          'dataItems.saveShare.sections.panels.bullets.3',
        ],
      },
      {
        headingKey: 'dataItems.saveShare.sections.timelines.heading',
        bulletKeys: [
          'dataItems.saveShare.sections.timelines.bullets.0',
          'dataItems.saveShare.sections.timelines.bullets.1',
          'dataItems.saveShare.sections.timelines.bullets.2',
          'dataItems.saveShare.sections.timelines.bullets.3',
        ],
      },
    ],
  },
  'project-goal': simpleContent('projectGoal', ['videoAnalysis', 'sport', 'beginner'], 3),
  'ux-ui-workflow': simpleContent('uxWorkflow', ['interface', 'editMode', 'productivity'], 3, 'states'),
  'analysis-page-overview': simpleContent('analysisOverview', ['video', 'timeline', 'sequencer'], 4),
  'legacy-video-shortcuts': legacyVideoShortcutsContent(),
  'sequencer-overview': twoSectionContent('sequencerOverview', ['sequencer', 'observation', 'tracking'], 3, 3),
  'timeline-overview': twoSectionContent('timelineOverview', ['timeline', 'shortcuts', 'preparation'], 4, 0, 2),
  'ffmpeg-installation': simpleContent('ffmpegInstallation', ['comingSoon', 'ffmpeg', 'video'], 0, undefined, 2),
};

const fallbackTextContent: TextBlockContent = {
  titleKey: 'dataItems.fallback.title',
  tagsKeys: ['dataItems.tags.home'],
  miniDescriptionKey: 'dataItems.fallback.miniDescription',
  introKey: 'dataItems.fallback.intro',
};

const genericMeta: DataItemMeta = {
  titleKey: 'dataItems.generic.title',
  tagsKeys: ['dataItems.tags.discovery'],
};

const priceMeta: DataItemMeta = {
  titleKey: 'dataItems.price.title',
  tagsKeys: ['dataItems.tags.videoAnalysis', 'dataItems.tags.subscription', 'dataItems.tags.club'],
  miniDescriptionKey: 'dataItems.price.miniDescription',
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

function simpleContent(
  key: string,
  tagKeys: string[],
  bulletCount: number,
  sectionName = 'main',
  paragraphCount = 0,
): TextBlockContent {
  return {
    titleKey: `dataItems.${key}.title`,
    tagsKeys: tagKeys.map(tag => `dataItems.tags.${tag}`),
    miniDescriptionKey: `dataItems.${key}.miniDescription`,
    introKey: `dataItems.${key}.intro`,
    sections: [
      {
        headingKey: sectionName ? `dataItems.${key}.sections.${sectionName}.heading` : undefined,
        bulletKeys: Array.from({ length: bulletCount }, (_, index) => `dataItems.${key}.sections.${sectionName}.bullets.${index}`),
        paragraphKeys: Array.from(
          { length: paragraphCount },
          (_, index) => `dataItems.${key}.sections.${sectionName}.paragraphs.${index}`,
        ),
      },
    ],
  };
}

function twoSectionContent(
  key: string,
  tagKeys: string[],
  firstBulletCount: number,
  secondBulletCount: number,
  secondParagraphCount = 0,
): TextBlockContent {
  return {
    titleKey: `dataItems.${key}.title`,
    tagsKeys: tagKeys.map(tag => `dataItems.tags.${tag}`),
    miniDescriptionKey: `dataItems.${key}.miniDescription`,
    introKey: `dataItems.${key}.intro`,
    sections: [
      {
        headingKey: `dataItems.${key}.sections.first.heading`,
        bulletKeys: Array.from({ length: firstBulletCount }, (_, index) => `dataItems.${key}.sections.first.bullets.${index}`),
      },
      {
        headingKey: `dataItems.${key}.sections.second.heading`,
        bulletKeys: Array.from({ length: secondBulletCount }, (_, index) => `dataItems.${key}.sections.second.bullets.${index}`),
        paragraphKeys: Array.from(
          { length: secondParagraphCount },
          (_, index) => `dataItems.${key}.sections.second.paragraphs.${index}`,
        ),
      },
    ],
  };
}

function legacyVideoShortcutsContent(): TextBlockContent {
  return {
    titleKey: 'dataItems.legacyVideoShortcuts.title',
    tagsKeys: ['dataItems.tags.video', 'dataItems.tags.shortcuts', 'dataItems.tags.timeSaving'],
    miniDescriptionKey: 'dataItems.legacyVideoShortcuts.miniDescription',
    introKey: 'dataItems.legacyVideoShortcuts.intro',
    sections: [
      {
        headingKey: 'dataItems.legacyVideoShortcuts.sections.actions.heading',
        bulletKeys: [
          'dataItems.legacyVideoShortcuts.sections.actions.bullets.0',
          'dataItems.legacyVideoShortcuts.sections.actions.bullets.1',
          'dataItems.legacyVideoShortcuts.sections.actions.bullets.2',
          'dataItems.legacyVideoShortcuts.sections.actions.bullets.3',
        ],
      },
      {
        headingKey: 'dataItems.legacyVideoShortcuts.sections.benefits.heading',
        paragraphKeys: [
          'dataItems.legacyVideoShortcuts.sections.benefits.paragraphs.0',
          'dataItems.legacyVideoShortcuts.sections.benefits.paragraphs.1',
        ],
      },
      {
        paragraphKeys: ['dataItems.legacyVideoShortcuts.sections.compatibility.paragraphs.0'],
      },
    ],
  };
}
