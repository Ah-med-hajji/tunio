import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlacesPublicComponent } from './places-public.component';

describe('PlacesPublicComponent', () => {
  let component: PlacesPublicComponent;
  let fixture: ComponentFixture<PlacesPublicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlacesPublicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlacesPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
