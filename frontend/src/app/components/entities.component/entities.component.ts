import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import {
  EntityService,
  Entity,
  EntityFormData,
  EntityType,
  EntityEyeColor,
} from '../../services/entity.service';

@Component({
  selector: 'app-entities',
  standalone: true,
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './entities.component.html',
  styleUrls: ['./entities.component.scss'],
})
export class EntitiesComponent {
  private entityService = inject(EntityService);

  // UI State signals
  entityBeingEdited = signal<Entity | null>(null);
  entityBeingDeleted = signal<Entity | null>(null);
  newEntityForm = signal<EntityFormData>(
    this.entityService.createEmptyEntity()
  );

  // Expose service state through getters for template
  get entities() {
    return this.entityService.entities;
  }
  get selectedTypes() {
    return this.entityService.selectedTypes;
  }
  get selectedEyeColors() {
    return this.entityService.selectedEyeColors;
  }
  get dateFilter() {
    return this.entityService.dateFilter;
  }
  get loading() {
    return this.entityService.loading;
  }
  get error() {
    return this.entityService.error;
  }
  get isAllTypesSelected() {
    return this.entityService.isAllTypesSelected;
  }
  get isAllEyeColorsSelected() {
    return this.entityService.isAllEyeColorsSelected;
  }
  get hasActiveFilters() {
    return this.entityService.hasActiveFilters;
  }

  // Expose constants
  get entityTypes() {
    return this.entityService.ENTITY_TYPES;
  }
  get entityEyeColors() {
    return this.entityService.ENTITY_EYE_COLORS;
  }
  get today() {
    return this.entityService.TODAY;
  }

  // Type filter methods
  toggleType(type: EntityType, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked && !this.selectedTypes().includes(type)) {
      this.entityService.toggleType(type);
    } else if (!target.checked && this.selectedTypes().includes(type)) {
      this.entityService.toggleType(type);
    }
  }

  toggleAllTypes(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.entityService.setAllTypes(target.checked);
  }

  // Eye color filter methods
  toggleEyeColor(color: EntityEyeColor, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked && !this.selectedEyeColors().includes(color)) {
      this.entityService.toggleEyeColor(color);
    } else if (!target.checked && this.selectedEyeColors().includes(color)) {
      this.entityService.toggleEyeColor(color);
    }
  }

  toggleAllEyeColors(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.entityService.setAllEyeColors(target.checked);
  }

  // Date filter methods
  onDateFilterChange(): void {
    const dateFilter = this.dateFilter();
    this.entityService.setDateFilter(dateFilter.from, dateFilter.to);
  }

  updateDateFrom(value: string): void {
    const current = this.dateFilter();
    this.entityService.setDateFilter(value, current.to);
  }

  updateDateTo(value: string): void {
    const current = this.dateFilter();
    this.entityService.setDateFilter(current.from, value);
  }

  clearDateFilter(): void {
    this.entityService.clearDateFilter();
  }

  clearAllFilters(): void {
    this.entityService.clearAllFilters();
  }

  // Entity CRUD operations
  addEntity(): void {
    const formData = this.newEntityForm();

    this.entityService.addEntity(formData).subscribe({
      next: () => {
        this.resetNewEntityForm();
        this.closeModal('addEntityModal');
      },
      error: (error) => {
        console.error('Error adding entity:', error);
        // Handle error (show toast, etc.)
      },
    });
  }

  openDeleteModal(entityId: number): void {
    const entity = this.entityService.getEntityById(entityId);
    if (entity) {
      this.entityBeingDeleted.set(entity);
      this.openModal('deleteEntityModal');
    }
  }

  confirmDelete(): void {
    const entity = this.entityBeingDeleted();
    if (!entity) return;

    this.entityService.deleteEntity(entity.id).subscribe({
      next: () => {
        console.log('Entity deleted successfully');
        this.cancelDelete();
        this.closeModal('deleteEntityModal');
      },
      error: (error) => {
        console.error('Error deleting entity:', error);
        // Handle error
      },
    });
  }

  cancelDelete(): void {
    this.entityBeingDeleted.set(null);
  }

  editEntity(id: number): void {
    const entity = this.entityService.getEntityById(id);
    if (entity) {
      this.entityBeingEdited.set({ ...entity });
    }
  }

  saveEntity(): void {
    const entity = this.entityBeingEdited();
    if (!entity) return;

    const formData = this.entityService.entityToFormData(entity);

    this.entityService.updateEntity(entity.id, formData).subscribe({
      next: () => {
        this.cancelEdit();
        this.closeModal('editEntityModal');
      },
      error: (error) => {
        console.error('Error updating entity:', error);
        // Handle error
      },
    });
  }

  cancelEdit(): void {
    this.entityBeingEdited.set(null);
  }

  cancelAdd(): void {
    this.resetNewEntityForm();
  }

  // Modal operations
  openEditModal(entityId: number): void {
    this.editEntity(entityId);
    this.openModal('editEntityModal');
  }

  openAddModal(): void {
    this.resetNewEntityForm();
    this.openModal('addEntityModal');
  }

  // Form helpers
  private resetNewEntityForm(): void {
    this.newEntityForm.set(this.entityService.createEmptyEntity());
  }

  updateNewEntityField<FieldName extends keyof EntityFormData>(
    field: FieldName,
    value: EntityFormData[FieldName]
  ): void {
    const current = this.newEntityForm();
    this.newEntityForm.set({ ...current, [field]: value });
  }

  updateEditingEntityField<FieldName extends keyof Entity>(
    field: FieldName,
    value: Entity[FieldName]
  ): void {
    const current = this.entityBeingEdited();
    if (current) {
      this.entityBeingEdited.set({ ...current, [field]: value });
    }
  }

  // Modal utility methods
  private openModal(modalId: string): void {
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(modalId)
    );
    modal.show();
  }

  private closeModal(modalId: string): void {
    const modal = (window as any).bootstrap.Modal.getInstance(
      document.getElementById(modalId)
    );
    if (modal) {
      modal.hide();
    }
  }

  // Validation helpers for template
  isNewEntityValid(): boolean {
    const form = this.newEntityForm();
    return !!(form.type && form.date_of_birth && form.eye_color);
  }

  isEditEntityValid(): boolean {
    const entity = this.entityBeingEdited();
    return !!(entity?.type && entity?.date_of_birth && entity?.eye_color);
  }
}
