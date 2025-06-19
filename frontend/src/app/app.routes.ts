import { Routes } from '@angular/router';
import { EntitiesComponent } from './components/entities.component/entities.component';
export const routes: Routes = [
  { path: '', redirectTo: 'entities', pathMatch: 'full' },
  {
    path: 'entities',
    component: EntitiesComponent,
  },
];
