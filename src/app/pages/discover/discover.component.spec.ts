import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { getTranslocoTestingModule } from '../../core/i18n/transloco-testing';
import { selectDisplayedItems } from '../../store/Data/dataState.selectors';
import { DiscoverComponent } from './discover.component';

describe('DiscoverComponent', () => {
  let component: DiscoverComponent;
  let fixture: ComponentFixture<DiscoverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscoverComponent, getTranslocoTestingModule()],
      providers: [
        provideMockStore({
          selectors: [
            {
              selector: selectDisplayedItems,
              value: [],
            },
          ],
        }),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
