import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntitiesComponent } from './entities.component';
import {
  EntityService,
  Entity,
  EntityFormData,
} from '../../services/entity.service';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { signal } from '@angular/core';

// Create a mock EntityService
const mockEntityService = jasmine.createSpyObj<EntityService>('EntityService', [
  'createEmptyEntity',
  'addEntity',
  'getEntityById',
  'deleteEntity',
  'updateEntity',
  'entityToFormData',
  'toggleType',
  'setAllTypes',
  'toggleEyeColor',
  'setAllEyeColors',
  'setDateFilter',
  'clearDateFilter',
  'clearAllFilters',
]);
mockEntityService.addEntity.and.returnValue(of({}));
mockEntityService.deleteEntity.and.returnValue(of({}));
mockEntityService.createEmptyEntity.and.returnValue({
  type: undefined,
  eye_color: undefined,
  date_of_birth: '',
});

Object.defineProperties(mockEntityService, {
  entities: { value: signal([]) },
  selectedTypes: { value: signal([]) },
  selectedEyeColors: { value: signal([]) },
  dateFilter: { value: signal({ from: '', to: '' }) },
  loading: { value: signal(false) },
  error: { value: signal(null) },
  isAllTypesSelected: { value: signal(false) },
  isAllEyeColorsSelected: { value: signal(false) },
  hasActiveFilters: { value: signal(false) },
  ENTITY_TYPES: { value: ['person', 'dog'] },
  ENTITY_EYE_COLORS: { value: ['blue', 'green'] },
  TODAY: { value: '2025-06-19' },
});
describe('EntitiesComponent', () => {
  let component: EntitiesComponent;
  let fixture: ComponentFixture<EntitiesComponent>;

  // Mock entity for testing
  const mockEntity: Entity = {
    id: 1,
    type: 'person',
    eye_color: 'blue',
    date_of_birth: '1991-10-28',
  };

  // Define an empty form data object for testing
  const emptyFormData: EntityFormData = {
    type: undefined,
    eye_color: undefined,
    date_of_birth: '',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntitiesComponent, FormsModule],
      providers: [
        { provide: EntityService, useValue: mockEntityService },
        TitleCasePipe,
      ],
    }).compileComponents();
    // Mocking the EntityService methods
    mockEntityService.getEntityById.and.returnValue(mockEntity);
    mockEntityService.updateEntity.and.returnValue(of({}));
    // Creating the fixture and component instance
    fixture = TestBed.createComponent(EntitiesComponent);
    // Mocking the bootstrap modal functionality
    (window as any).bootstrap = {
      Modal: class {
        constructor(public element: any) {}
        show() {}
        hide() {}
        static getInstance() {
          return {
            hide: () => {},
          };
        }
      },
    };

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call addEntity and reset form on success', () => {
    spyOn<any>(component, 'resetNewEntityForm');
    spyOn<any>(component, 'closeModal');
    component.addEntity();
    expect(mockEntityService.addEntity).toHaveBeenCalled();
    expect(component['resetNewEntityForm']).toHaveBeenCalled();
    expect(component['closeModal']).toHaveBeenCalledWith('addEntityModal');
  });

  it('should call deleteEntity and close modal on success', () => {
    component['entityBeingDeleted'].set(mockEntity);
    spyOn<any>(component, 'closeModal');
    spyOn(component, 'cancelDelete');
    component.confirmDelete();
    expect(mockEntityService.deleteEntity).toHaveBeenCalledWith(mockEntity.id);
    expect(component.cancelDelete).toHaveBeenCalled();
    expect(component['closeModal']).toHaveBeenCalledWith('deleteEntityModal');
  });

  it('should set entityBeingDeleted on openDeleteModal', () => {
    component.openDeleteModal(mockEntity.id);
    expect(component['entityBeingDeleted']()).toEqual(mockEntity);
  });

  it('should set entityBeingEdited on editEntity', () => {
    component.editEntity(mockEntity.id);
    expect(component['entityBeingEdited']()).toEqual(mockEntity);
  });

  it('should update and save entity', () => {
    component['entityBeingEdited'].set(mockEntity);

    // Mocking the entityToFormData method to return a valid object
    mockEntityService.entityToFormData.and.returnValue({
      type: mockEntity.type,
      eye_color: mockEntity.eye_color,
      date_of_birth: mockEntity.date_of_birth,
    });

    // Making sure updateEntity returns an observable
    mockEntityService.updateEntity.and.returnValue(of({}));

    // Spying on the methods that should be called
    spyOn(component, 'cancelEdit');
    spyOn<any>(component, 'closeModal');

    // Call the method to save the entity
    component.saveEntity();

    expect(mockEntityService.updateEntity).toHaveBeenCalledWith(
      mockEntity.id,
      jasmine.any(Object)
    );

    expect(component.cancelEdit).toHaveBeenCalled();
    expect(component['closeModal']).toHaveBeenCalledWith('editEntityModal');
  });

  it('should validate new entity form', () => {
    component['newEntityForm'].set({ ...mockEntity });
    expect(component.isNewEntityValid()).toBeTrue();
  });

  it('should invalidate new entity form', () => {
    component['newEntityForm'].set({ ...emptyFormData });
    expect(component.isNewEntityValid()).toBeFalse();
  });

  it('should update new entity field', () => {
    component.updateNewEntityField('type', 'person');
    expect(component['newEntityForm']().type).toBe('person');
  });

  it('should update editing entity field', () => {
    component['entityBeingEdited'].set({ ...mockEntity });
    component.updateEditingEntityField('eye_color', 'green');
    expect(component['entityBeingEdited']()?.eye_color).toBe('green');
  });
});
