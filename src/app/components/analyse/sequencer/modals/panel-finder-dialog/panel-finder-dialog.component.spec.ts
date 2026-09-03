import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PanelResourceResponse } from '../../../../../interfaces/analysis-store';
import { getTranslocoTestingModule } from '../../../../../core/i18n/transloco-testing';
import { PanelFinderDialogComponent } from './panel-finder-dialog.component';

describe('PanelFinderDialogComponent', () => {
  let fixture: ComponentFixture<PanelFinderDialogComponent>;
  let component: PanelFinderDialogComponent;
  let dialogRef: { close: jasmine.Spy };
  const ownerPublicPanel = buildPanelResource('owner-public', 'owner-1', 'public');
  const ownerPrivatePanel = buildPanelResource('owner-private', 'owner-1', 'private');
  const otherPublicPanel = buildPanelResource('other-public', 'owner-2', 'public');

  beforeEach(async () => {
    dialogRef = { close: jasmine.createSpy('close') };

    await TestBed.configureTestingModule({
      imports: [PanelFinderDialogComponent, NoopAnimationsModule, getTranslocoTestingModule()],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            panels: [ownerPublicPanel, ownerPrivatePanel, otherPublicPanel],
            currentUserId: 'owner-1',
          },
        },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PanelFinderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('detects when an owned shared panel can be made private', () => {
    expect(component.canMakePrivate(ownerPublicPanel)).toBeTrue();
    expect(component.canMakePrivate(ownerPrivatePanel)).toBeFalse();
    expect(component.canMakePrivate(otherPublicPanel)).toBeFalse();
  });

  it('closes with makePrivate and delete intents for owned panels', () => {
    component.makePrivate(ownerPublicPanel);
    expect(dialogRef.close).toHaveBeenCalledWith({ action: 'makePrivate', panel: ownerPublicPanel });

    component.deletePanel(ownerPrivatePanel);
    expect(dialogRef.close).toHaveBeenCalledWith({ action: 'delete', panel: ownerPrivatePanel });
  });

  it('filters owner panels independently from visibility', () => {
    component.onlyMine.set(true);

    expect(component.filteredPanels().map(panel => panel.id)).toEqual(['owner-private', 'owner-public']);
  });
});

function buildPanelResource(
  id: string,
  ownerUserId: string,
  visibility: PanelResourceResponse['visibility'],
): PanelResourceResponse {
  return {
    id,
    ownerUserId,
    title: id,
    description: null,
    visibility,
    clubId: null,
    contentJson: {
      schemaVersion: '1.0.0',
      type: 'sequencer-panel',
      panelName: id,
      btnList: [],
    },
    hasAnonymizedContent: false,
    createdAt: '2026-09-03T00:00:00.000Z',
    updatedAt: `2026-09-03T00:0${id === 'owner-private' ? 2 : 1}:00.000Z`,
  };
}
