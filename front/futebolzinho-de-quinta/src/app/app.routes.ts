import { Routes } from '@angular/router';
import { PartidasComponent } from './partidas/partidas.component';
import { JogadoresComponent } from './jogadores/jogadores.component';
import { EstatisticasComponent } from './estatisticas/estatisticas.component';
import { PartidaFormComponent } from './partida-form/partida-form.component';
import { PartidaStatsComponent } from './partida-stats/partida-stats.component';
import { DesculpasComponent } from './desculpas/desculpas.component';

export const routes: Routes = [
  { path: 'jogador', component: JogadoresComponent },
  { path: '', component: PartidasComponent },
  { path: 'estatistica', component: EstatisticasComponent },
  { path: 'partida-form', component: PartidaFormComponent },
  { path: 'desculpas', component: DesculpasComponent },
  // { path: 'partida-stats', component: PartidaStatsComponent },
  // { path: '', redirectTo: '/partida', pathMatch: 'full' },
];