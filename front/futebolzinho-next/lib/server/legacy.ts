import { createRequire } from "node:module";

const requireFromHere = createRequire(import.meta.url);

export const LegacyModels = {
  Jogadores: requireFromHere("../../server/legacy/models/jogadores"),
  Partidas: requireFromHere("../../server/legacy/models/partidas"),
  PartidasAvulsas: requireFromHere("../../server/legacy/models/partida-avulsa"),
  Desculpa: requireFromHere("../../server/legacy/models/desculpas"),
} as const;

export const LegacyServices = {
  FirebaseConnection: requireFromHere("../../server/legacy/db"),
} as const;
