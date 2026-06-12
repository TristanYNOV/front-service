import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';

import { AnyDataItems } from '../../interfaces/dataItem.interface';
import { DiscoverCanvasComponent } from '../../components/discover-canvas/discover-canvas.component';
import { selectDisplayedItems } from '../../store/Data/dataState.selectors';
import { DiscoverComponent } from './discover.component';

@Component({
  selector: 'app-discover-canvas',
  standalone: true,
  template: '',
})
class DiscoverCanvasStubComponent {
  @Input() items: AnyDataItems[] = [];
}

describe('DiscoverComponent', () => {
  let component: DiscoverComponent;
  let fixture: ComponentFixture<DiscoverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscoverComponent],
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
    .overrideComponent(DiscoverComponent, {
      remove: { imports: [DiscoverCanvasComponent] },
      add: { imports: [DiscoverCanvasStubComponent] },
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
