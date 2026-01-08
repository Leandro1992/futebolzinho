import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesculpasComponent } from './desculpas.component';

describe('DesculpasComponent', () => {
  let component: DesculpasComponent;
  let fixture: ComponentFixture<DesculpasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesculpasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesculpasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
