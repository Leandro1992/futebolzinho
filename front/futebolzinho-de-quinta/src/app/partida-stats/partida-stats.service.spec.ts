import { TestBed } from '@angular/core/testing';

import { PartidaStatsService } from './partida-stats.service';

describe('PartidaStatsService', () => {
  let service: PartidaStatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PartidaStatsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
