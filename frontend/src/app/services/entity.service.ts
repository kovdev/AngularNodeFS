import { Injectable, signal, computed, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  GET_ENTITIES,
  ADD_ENTITY,
  UPDATE_ENTITY,
  DELETE_ENTITY,
} from '../graphql/queries/entities.query';

// Types
export type EntityType = 'person' | 'cat' | 'dog';
export type EntityEyeColor = 'brown' | 'blue' | 'green';

export interface Entity {
  id: number;
  type: EntityType;
  date_of_birth: string;
  eye_color: EntityEyeColor;
}

export interface EntityFilters {
  types?: EntityType[];
  eyeColors?: EntityEyeColor[];
  dateFrom?: string;
  dateTo?: string;
}

export interface EntityFormData {
  type?: EntityType;
  date_of_birth: string;
  eye_color?: EntityEyeColor;
}

@Injectable({
  providedIn: 'root',
})
export class EntityService {
  private apollo = inject(Apollo);

  // Constants
  readonly ENTITY_TYPES: EntityType[] = ['person', 'cat', 'dog'];
  readonly ENTITY_EYE_COLORS: EntityEyeColor[] = ['brown', 'blue', 'green'];
  readonly TODAY = new Date().toISOString().split('T')[0];

  // Signals for state management
  private _entities = signal<Entity[]>([]);
  private _selectedTypes = signal<EntityType[]>([...this.ENTITY_TYPES]);
  private _selectedEyeColors = signal<EntityEyeColor[]>([
    ...this.ENTITY_EYE_COLORS,
  ]);
  private _dateFilter = signal<{ from: string; to: string }>({
    from: '',
    to: '',
  });
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly entities = this._entities.asReadonly();
  readonly selectedTypes = this._selectedTypes.asReadonly();
  readonly selectedEyeColors = this._selectedEyeColors.asReadonly();
  readonly dateFilter = this._dateFilter.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly currentFilters = computed(() => this.buildFilters());
  readonly isAllTypesSelected = computed(
    () => this._selectedTypes().length === this.ENTITY_TYPES.length
  );
  readonly isAllEyeColorsSelected = computed(
    () => this._selectedEyeColors().length === this.ENTITY_EYE_COLORS.length
  );
  readonly hasActiveFilters = computed(() => {
    const filters = this.currentFilters();
    return !!(
      filters.types ||
      filters.eyeColors ||
      filters.dateFrom ||
      filters.dateTo
    );
  });

  constructor() {
    this.loadEntities();
  }

  // Entity CRUD operations
  loadEntities(): void {
    this._loading.set(true);
    this._error.set(null);

    const filters = this.buildFilters();

    this.apollo
      .watchQuery<{ entities: Entity[] }>({
        query: GET_ENTITIES,
        variables: { filters },
        fetchPolicy: 'network-only',
      })
      .valueChanges.subscribe({
        next: (result) => {
          this._entities.set(result.data.entities);
          this._loading.set(false);
        },
        error: (error) => {
          console.error('Error loading entities:', error);
          this._error.set('Failed to load entities');
          this._loading.set(false);
        },
      });
  }

  addEntity(entityData: EntityFormData): Observable<any> {
    if (!this.isValidEntityData(entityData)) {
      throw new Error('Invalid entity data');
    }

    this._loading.set(true);
    this._error.set(null);

    return this.apollo
      .mutate({
        mutation: ADD_ENTITY,
        variables: {
          type: entityData.type,
          date_of_birth: entityData.date_of_birth,
          eye_color: entityData.eye_color,
        },
        refetchQueries: [
          {
            query: GET_ENTITIES,
            variables: { filters: this.buildFilters() },
          },
        ],
      })
      .pipe(
        map((result) => {
          this._loading.set(false);
          return result;
        })
      );
  }

  updateEntity(id: number, entityData: EntityFormData): Observable<any> {
    if (!this.isValidEntityData(entityData)) {
      throw new Error('Invalid entity data');
    }

    this._loading.set(true);
    this._error.set(null);

    return this.apollo
      .mutate({
        mutation: UPDATE_ENTITY,
        variables: {
          id,
          type: entityData.type,
          date_of_birth: entityData.date_of_birth,
          eye_color: entityData.eye_color,
        },
        refetchQueries: [
          {
            query: GET_ENTITIES,
            variables: { filters: this.buildFilters() },
          },
        ],
      })
      .pipe(
        map((result) => {
          this._loading.set(false);
          return result;
        })
      );
  }

  deleteEntity(id: number): Observable<any> {
    this._loading.set(true);
    this._error.set(null);

    return this.apollo
      .mutate({
        mutation: DELETE_ENTITY,
        variables: { id },
        refetchQueries: [
          {
            query: GET_ENTITIES,
            variables: { filters: this.buildFilters() },
          },
        ],
      })
      .pipe(
        map((result) => {
          this._loading.set(false);
          return result;
        })
      );
  }

  // Filter operations
  setTypeFilters(types: EntityType[]): void {
    this._selectedTypes.set([...types]);
    this.loadEntities();
  }

  toggleType(type: EntityType): void {
    const current = this._selectedTypes();
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    this.setTypeFilters(updated);
  }

  setAllTypes(selected: boolean): void {
    this.setTypeFilters(selected ? [...this.ENTITY_TYPES] : []);
  }

  setEyeColorFilters(colors: EntityEyeColor[]): void {
    this._selectedEyeColors.set([...colors]);
    this.loadEntities();
  }

  toggleEyeColor(color: EntityEyeColor): void {
    const current = this._selectedEyeColors();
    const updated = current.includes(color)
      ? current.filter((c) => c !== color)
      : [...current, color];
    this.setEyeColorFilters(updated);
  }

  setAllEyeColors(selected: boolean): void {
    this.setEyeColorFilters(selected ? [...this.ENTITY_EYE_COLORS] : []);
  }

  setDateFilter(from: string, to: string): void {
    this._dateFilter.set({ from, to });
    this.loadEntities();
  }

  clearDateFilter(): void {
    this.setDateFilter('', '');
  }

  clearAllFilters(): void {
    this._selectedTypes.set([...this.ENTITY_TYPES]);
    this._selectedEyeColors.set([...this.ENTITY_EYE_COLORS]);
    this._dateFilter.set({ from: '', to: '' });
    this.loadEntities();
  }

  // Helper methods
  getEntityById(id: number): Entity | undefined {
    return this._entities().find((entity) => entity.id === id);
  }

  createEmptyEntity(): EntityFormData {
    return {
      type: undefined,
      date_of_birth: '',
      eye_color: undefined,
    };
  }

  entityToFormData(entity: Entity): EntityFormData {
    return {
      type: entity.type,
      date_of_birth: entity.date_of_birth,
      eye_color: entity.eye_color,
    };
  }

  private buildFilters(): EntityFilters {
    const filters: EntityFilters = {};
    const selectedTypes = this._selectedTypes();
    const selectedEyeColors = this._selectedEyeColors();
    const dateFilter = this._dateFilter();

    // Only add filters if not all options are selected
    if (
      selectedTypes.length < this.ENTITY_TYPES.length &&
      selectedTypes.length > 0
    ) {
      filters.types = selectedTypes;
    }

    if (
      selectedEyeColors.length < this.ENTITY_EYE_COLORS.length &&
      selectedEyeColors.length > 0
    ) {
      filters.eyeColors = selectedEyeColors;
    }

    if (dateFilter.from) {
      filters.dateFrom = dateFilter.from;
    }

    if (dateFilter.to) {
      filters.dateTo = dateFilter.to;
    }

    return filters;
  }

  // Validation for entity data
  private isValidEntityData(
    data: EntityFormData
  ): data is Required<EntityFormData> {
    return !!(data.type && data.date_of_birth && data.eye_color);
  }
}
