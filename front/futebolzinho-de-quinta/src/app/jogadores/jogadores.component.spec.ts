import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JogadoresComponent } from './jogadores.component';

describe('JogadoresComponent', () => {
  let component: JogadoresComponent;
  let fixture: ComponentFixture<JogadoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JogadoresComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JogadoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
