import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartidaStatsComponent } from './partida-stats.component';

describe('PartidaStatsComponent', () => {
  let component: PartidaStatsComponent;
  let fixture: ComponentFixture<PartidaStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartidaStatsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PartidaStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
