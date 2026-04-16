export type Jogador = {
  id: string;
  nome: string;
  mensalista: boolean;
  gol?: number;
  assistencia?: number;
  golContra?: number;
  destaque?: boolean;
  bolaMurcha?: boolean;
  fixo?: boolean;
};

export type Partida = {
  id: string;
  data: string;
  local: string;
  status: number;
  timeA: Jogador[];
  timeB: Jogador[];
  totalGolsTimeA: number;
  totalGolsTimeB: number;
  totalGolsContraTimeA: number;
  totalGolsContraTimeB: number;
  totalAssistenciasTimeA: number;
  totalAssistenciasTimeB: number;
};

export type Estatistica = {
  jogadorId: string;
  jogador: { nome: string; mensalista: boolean };
  jogos: number;
  gols: number;
  assistencia: number;
  golContra: number;
  destaque: number;
  bolaMurcha: number;
  vitorias: number;
  derrotas: number;
  empates: number;
};

export type Desculpa = {
  id?: string;
  jogadorId: string;
  jogadorNome: string;
  data: string;
  descricao: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
};

export type PartidaAvulsa = {
  id?: string;
  data: string;
  local: string;
  nome: string;
  encerrada: boolean;
  jogadores: Array<Record<string, unknown>>;
};
