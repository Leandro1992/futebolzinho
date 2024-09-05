import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideHttpClient(), { provide: LocationStrategy, useClass: HashLocationStrategy }],
};
