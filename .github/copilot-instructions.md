# Futebolzinho - Sistema de Gerenciamento de Partidas de Futebol

## Architecture Overview
Full-stack monorepo with Express backend serving Firebase Firestore data and Angular 17 SPA frontend:
- **Backend** (`/`): Node.js Express API with Firebase Firestore
- **Frontend** (`/front/futebolzinho-de-quinta`): Angular 17 standalone app
- **Deployment**: Express serves built Angular from `/public/browser` (single server deployment)

## Key Technologies
- **Backend**: Express 4, Firebase Admin SDK, Winston logging, Helmet security, JWT-like auth
- **Frontend**: Angular 17 (standalone components), Bootstrap 5, RxJS
- **Database**: Firebase Firestore with subcollections pattern
- **Cache**: In-memory singleton cache (see `models/cache.js`)

## Critical Patterns

### Database Layer (`db/index.js`)
Singleton Firebase connection using service account credentials:
```javascript
FirebaseConnection.getInstance().db // Access Firestore
```
**Environment handling**: Tries `credenciais.json` first, falls back to env vars in production

### Model Pattern
All models in `/models`:
- Use static methods for queries: `Jogadores.obterTodos()`, `Partida.obterTodas()`
- Instance methods for mutations: `new Jogador(data).salvar()`, `jogador.atualizarDados()`
- **Cache invalidation**: Models manually update cache on writes (see `jogadores.js` lines 22-26)
- **References**: Partidas store Firestore references to jogadores, not embedded docs

### Authentication (`middlewares/auth.js`)
Simple Bearer token matching Firebase `private_key_id`:
```javascript
Authorization: Bearer <private_key_id from credenciais.json>
```
**Not JWT** - direct string comparison. Protected routes use `authenticate` middleware.

### Frontend-Backend Integration
- Angular uses relative paths (`/api/*`) - no environment files
- Express serves Angular at all routes except `/api/*` (SPA fallback in `index.js` line 63)
- HashLocationStrategy for routing (handles refresh properly)

### Cache Strategy (`models/cache.js`)
Simple in-memory store, cleared on server restart:
- Read: `cache.get('jogadores')` returns null if not set
- Write: `cache.set('jogadores', data)` 
- **Pattern**: Models check cache first, query DB if null, then populate cache

### Logging (`utils/logger.js`)
Winston with file transports:
- `logs/error.log` - errors only
- `logs/combined.log` - all logs
- Console in dev mode (non-production NODE_ENV)

## Development Workflows

### Backend Development
```powershell
npm run dev        # Nodemon auto-reload
npm test           # Jest tests
npm run lint       # ESLint
npm start          # Production mode
```

### Frontend Development  
```powershell
cd front/futebolzinho-de-quinta
npm start          # Dev server on localhost:4200
npm run build      # Outputs to ../../public/browser
```

### Full Stack Testing
1. Build frontend: `cd front/futebolzinho-de-quinta && npm run build`
2. Start backend: `npm start` (serves built Angular)
3. Access at `http://localhost:3000`

## Common Tasks

### Adding a New Model
1. Create class in `models/` extending Firebase pattern (see `jogadores.js`)
2. Implement static `obterTodos()` with cache check
3. Instance `salvar()` invalidates relevant cache keys
4. Add routes in `routes/<model>.routes.js`
5. Register in `index.js` routes section

### Adding API Endpoint
1. Create route file in `routes/` using Express Router
2. Import model from `models/`
3. Use `authenticate` middleware for protected routes
4. Register in `index.js`: `app.use('/api/<resource>', <resource>Routes)`

### Adding Frontend Feature
1. Angular 17 uses **standalone components** (no NgModule)
2. Services use `providedIn: 'root'` (singleton)
3. Add routes in `app.routes.ts`
4. HTTP calls use `/api/*` relative paths

## Important Constraints

- **No database migrations**: Firestore schema-less, changes handled in model layer
- **Stateless cache**: Cleared on restart, not shared across instances
- **Auth token**: Hardcoded in backend, must match `credenciais.json` key
- **SPA routing**: Uses hash strategy (`#/`) for deployment compatibility
- **Port 3000**: Default backend port, configurable via PORT env var
- **Credential files**: `.gitignore`d, use env vars in production (Heroku style)

## File Naming Conventions
- Routes: `<resource>.routes.js`
- Models: `<resource>.js` (lowercase)
- Angular components: `<feature>.component.ts` (kebab-case folders)
- Angular services: `<feature>.service.ts`

## Testing
- Backend: Jest (`tests/*.test.js`)
- Frontend: Jasmine/Karma (Angular default)
- **Pattern**: Currently minimal test coverage (see `tests/partida.test.js` for example)
