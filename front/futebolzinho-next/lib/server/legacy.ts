import { createRequire } from "node:module";

const requireFromHere = createRequire(import.meta.url);

export const LegacyModels = {
  Jogadores: requireFromHere("../../../../models/jogadores"),
  Partidas: requireFromHere("../../../../models/partidas"),
  PartidasAvulsas: requireFromHere("../../../../models/partida-avulsa"),
  Desculpa: requireFromHere("../../../../models/desculpas"),
} as const;

export const LegacyServices = {
  FirebaseConnection: requireFromHere("../../../../db"),
} as const;
