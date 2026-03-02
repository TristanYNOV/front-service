import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZoomControlsComponent } from './zoom-controls.component';

describe('ZoomControlsComponent', () => {
  let component: ZoomControlsComponent;
  let fixture: ComponentFixture<ZoomControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoomControlsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ZoomControlsComponent);
    component = fixture.componentInstance;
    component.min = 0.25;
    component.max = 1;
    component.step = 0.05;
    component.value = 1;
    fixture.detectChanges();
  });

  it('maps slider value directly when invert is false', () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.invert = false;
    component.onSliderInput({ target: { value: '0.7' } } as unknown as Event);

    expect(emitSpy).toHaveBeenCalledWith(0.7);
  });

  it('maps slider value inversely when invert is true', () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.invert = true;
    component.onSliderInput({ target: { value: '0.4' } } as unknown as Event);

    expect(emitSpy).toHaveBeenCalledWith(0.85);
  });

  it('clamps minus and plus actions to min and max', () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.value = component.min;
    component.zoomOut();
    component.value = component.max;
    component.zoomIn();

    expect(emitSpy).toHaveBeenCalledWith(component.min);
    expect(emitSpy).toHaveBeenCalledWith(component.max);
  });

  it('emits on slider input changes', () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.onSliderInput({ target: { value: '0.95' } } as unknown as Event);

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(0.95);
  });
});
