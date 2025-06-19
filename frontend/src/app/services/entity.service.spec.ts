import { TestBed } from '@angular/core/testing';
import {
  EntityService,
  EntityFormData,
  EntityType,
  EntityEyeColor,
  Entity,
} from './entity.service';
import { Apollo } from 'apollo-angular';
import { of, throwError } from 'rxjs';
import { ApolloQueryResult, OperationVariables } from '@apollo/client/core';
import { QueryRef } from 'apollo-angular';
import { fakeAsync, tick } from '@angular/core/testing';
describe('EntityService', () => {
  let service: EntityService;
  let mockApollo: jasmine.SpyObj<Apollo>;

  // Mock entities for testing
  const mockEntities: Entity[] = [
    {
      id: 1,
      type: 'cat' as EntityType,
      date_of_birth: '2020-01-01',
      eye_color: 'green' as EntityEyeColor,
    },
    {
      id: 2,
      type: 'dog' as EntityType,
      date_of_birth: '2019-05-20',
      eye_color: 'blue' as EntityEyeColor,
    },
  ];

  // Mock QueryRef for Apollo watchQuery
  const mockQueryRef: Partial<QueryRef<any, OperationVariables>> = {
    valueChanges: of({
      data: { entities: mockEntities },
      loading: false,
      networkStatus: 7,
    } as ApolloQueryResult<any>),
  };

  beforeEach(() => {
    // Create a mock Apollo service
    mockApollo = jasmine.createSpyObj<Apollo>('Apollo', [
      'watchQuery',
      'mutate',
    ]);

    // Mock the watchQuery method to return our mock QueryRef
    mockApollo.watchQuery.and.returnValue(
      mockQueryRef as QueryRef<any, OperationVariables>
    );

    // Mock the mutate method to return a successful response
    mockApollo.mutate.and.returnValue(
      of({
        data: { addEntity: {}, updateEntity: {}, deleteEntity: {} },
      })
    );

    // Configure the testing module with the EntityService and mock Apollo
    TestBed.configureTestingModule({
      providers: [EntityService, { provide: Apollo, useValue: mockApollo }],
    });

    service = TestBed.inject(EntityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Test loading entities on service initialization
  it('should load entities on init', fakeAsync(() => {
    const testEntities: Entity[] = [
      {
        id: 1,
        type: 'cat' as EntityType,
        date_of_birth: '2020-01-01',
        eye_color: 'green' as EntityEyeColor,
      },
      {
        id: 2,
        type: 'dog' as EntityType,
        date_of_birth: '2019-05-20',
        eye_color: 'blue' as EntityEyeColor,
      },
    ];

    mockApollo.watchQuery.and.returnValue({
      valueChanges: of({
        data: { entities: testEntities },
        loading: false,
        networkStatus: 7,
      }),
    } as any);

    // Recreate the service to trigger constructor logic
    service = TestBed.inject(EntityService);

    tick(); // simulate passage of time for observable to emit

    const entities = service.entities();
    expect(entities.length).toBe(2);
    expect(entities[0].type).toBe('cat');
  }));

  // Test loading entities with filters
  it('should add an entity', (done) => {
    const formData: EntityFormData = {
      type: 'person',
      date_of_birth: '2021-01-01',
      eye_color: 'brown',
    };

    service.addEntity(formData).subscribe(() => {
      expect(mockApollo.mutate).toHaveBeenCalled();
      done();
    });
  });

  // Test adding an entity with invalid data
  it('should not add entity with invalid data', () => {
    const formData = {
      date_of_birth: '2021-01-01',
    } as EntityFormData;

    expect(() => service.addEntity(formData)).toThrowError(
      'Invalid entity data'
    );
  });

  // Test updating an entity
  it('should update an entity', (done) => {
    const formData: EntityFormData = {
      type: 'dog',
      date_of_birth: '2019-01-01',
      eye_color: 'blue',
    };

    service.updateEntity(1, formData).subscribe(() => {
      expect(mockApollo.mutate).toHaveBeenCalled();
      done();
    });
  });

  // Test updating an entity with invalid data
  it('should not update entity with invalid data', () => {
    const formData = {
      eye_color: 'green',
      date_of_birth: '2020-01-01',
    } as EntityFormData;

    expect(() => service.updateEntity(1, formData)).toThrowError(
      'Invalid entity data'
    );
  });

  // Test deleting an entity
  it('should delete an entity', (done) => {
    service.deleteEntity(1).subscribe(() => {
      expect(mockApollo.mutate).toHaveBeenCalled();
      done();
    });
  });

  // Test deleting an entity that does not exist
  it('should return correct entity by ID', () => {
    expect(service.getEntityById(1)?.type).toBe('cat');
    expect(service.getEntityById(999)).toBeUndefined();
  });

  // Test entity type and eye color filters
  it('should set type filters and reload entities', () => {
    spyOn(service as any, 'loadEntities');
    service.setTypeFilters(['cat']);
    expect(service.selectedTypes()).toEqual(['cat']);
    expect((service as any).loadEntities).toHaveBeenCalled();
  });

  // Test toggling type filter
  it('should toggle type filter', () => {
    spyOn(service as any, 'loadEntities');
    const original = service.selectedTypes();
    service.toggleType('cat');
    expect(service.selectedTypes()).not.toEqual(original);
  });

  // Test setting all types and reloading
  it('should set all types and reload', () => {
    spyOn(service as any, 'loadEntities');
    service.setAllTypes(false);
    expect(service.selectedTypes()).toEqual([]);
    service.setAllTypes(true);
    expect(service.selectedTypes()).toEqual(['person', 'cat', 'dog']);
  });

  // Test eye color filters
  it('should set eye color filters and reload', () => {
    spyOn(service as any, 'loadEntities');
    service.setEyeColorFilters(['blue']);
    expect(service.selectedEyeColors()).toEqual(['blue']);
    expect((service as any).loadEntities).toHaveBeenCalled();
  });

  // Test toggling eye color filter
  it('should toggle eye color filter', () => {
    spyOn(service as any, 'loadEntities');
    const original = service.selectedEyeColors();
    service.toggleEyeColor('blue');
    expect(service.selectedEyeColors()).not.toEqual(original);
  });

  // Test setting all eye colors and reloading
  it('should set date filter and reload', () => {
    spyOn(service as any, 'loadEntities');
    service.setDateFilter('2020-01-01', '2021-01-01');
    expect(service.dateFilter()).toEqual({
      from: '2020-01-01',
      to: '2021-01-01',
    });
    expect((service as any).loadEntities).toHaveBeenCalled();
  });

  // Test clearing date filter
  it('should clear date filter', () => {
    spyOn(service as any, 'loadEntities');
    service.clearDateFilter();
    expect(service.dateFilter()).toEqual({ from: '', to: '' });
  });

  // Test clearing all filters
  it('should clear all filters and reload', () => {
    spyOn(service as any, 'loadEntities');
    service.clearAllFilters();
    expect(service.selectedTypes().length).toBe(3);
    expect(service.selectedEyeColors().length).toBe(3);
    expect(service.dateFilter()).toEqual({ from: '', to: '' });
    expect((service as any).loadEntities).toHaveBeenCalled();
  });

  // Test loading entities with filters
  it('should create empty entity form data', () => {
    const formData = service.createEmptyEntity();
    expect(formData).toEqual({
      type: undefined,
      date_of_birth: '',
      eye_color: undefined,
    });
  });

  // Test converting entity to form data
  it('should convert entity to form data', () => {
    const formData = service.entityToFormData(mockEntities[0]);
    expect(formData).toEqual({
      type: 'cat',
      date_of_birth: '2020-01-01',
      eye_color: 'green',
    });
  });

  // Test loading entities with filters
  it('should handle error in loadEntities', () => {
    mockApollo.watchQuery.and.returnValue({
      valueChanges: throwError(() => new Error('Query error')),
    } as any);

    service.loadEntities();
    expect(service.error()).toBe('Failed to load entities');
  });
});
