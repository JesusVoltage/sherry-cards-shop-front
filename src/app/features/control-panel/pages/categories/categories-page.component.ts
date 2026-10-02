import { Component, computed, DestroyRef, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideArrowDown, LucideArrowUp, LucideFolderPlus, LucideFolderTree, LucideImagePlus, LucidePencil, LucidePlus, LucideTrash2, LucideX
} from '@lucide/angular';
import { finalize } from 'rxjs';
import { apiFieldErrors } from '../../../../core/utils/api-errors';
import { AdminCategory, CategoryRequest } from '../../models/admin.model';
import { AdminApiService } from '../../services/admin-api.service';
import { adminErrorMessage } from '../../utils/admin-errors';
import { branchIds, CategoryRow, categoryRows, MAX_CATEGORY_DEPTH } from '../../utils/category-tree';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Árbol de categorías con su editor al lado. */
@Component({
  selector: 'scw-categories-page',
  imports: [
    ReactiveFormsModule,
    LucideArrowDown, LucideArrowUp, LucideFolderPlus, LucideFolderTree, LucideImagePlus, LucidePencil, LucidePlus, LucideTrash2, LucideX
  ],
  templateUrl: './categories-page.component.html',
  styleUrls: ['../../styles/panel-page.scss', './categories-page.component.scss']
})
export class CategoriesPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly editorRef = viewChild<ElementRef<HTMLElement>>('editor');

  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly rows = computed(() => categoryRows(this.categories()));
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly busy = signal(false);
  /** null: editor cerrado; 'new': alta; número: edición. */
  protected readonly editing = signal<number | 'new' | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly uploading = signal(false);
  protected readonly confirmDelete = signal<number | null>(null);
  protected readonly maxDepth = MAX_CATEGORY_DEPTH;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    slug: ['', [Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    imageUrl: [''],
    parentId: [null as number | null],
    active: [true]
  });

  protected readonly current = computed(() => {
    const editing = this.editing();
    return typeof editing === 'number' ? this.categories().find((category) => category.id === editing) ?? null : null;
  });
  /** Padres posibles: ni la propia rama (crearía un ciclo), ni Sin categoría, ni ramas ya en el último nivel. */
  protected readonly parentOptions = computed(() => {
    const current = this.current();
    const excluded = current ? branchIds(this.categories(), current.id) : new Set<number>();
    return this.rows().filter((row) => !row.category.system && !excluded.has(row.category.id) && row.depth < MAX_CATEGORY_DEPTH);
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.categories().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false))).subscribe({
      next: (categories) => this.categories.set(categories),
      error: (error: unknown) => this.loadError.set(adminErrorMessage(error, 'No se pudieron cargar las categorías.'))
    });
  }

  protected startCreate(parentId: number | null = null): void {
    this.resetMessages();
    this.editing.set('new');
    this.form.reset({ name: '', slug: '', description: '', imageUrl: '', parentId, active: true });
    this.form.controls.parentId.enable();
    this.form.controls.slug.enable();
    this.focusEditor();
  }

  protected startEdit(category: AdminCategory): void {
    this.resetMessages();
    this.editing.set(category.id);
    this.form.reset({
      name: category.name, slug: category.slug, description: category.description ?? '',
      imageUrl: category.imageUrl ?? '', parentId: category.parentId, active: category.active
    });
    if (category.system) {
      this.form.controls.parentId.disable();
      this.form.controls.slug.disable();
    } else {
      this.form.controls.parentId.enable();
      this.form.controls.slug.enable();
    }
    this.focusEditor();
  }

  protected close(): void {
    this.editing.set(null);
    this.formError.set(null);
  }

  protected save(): void {
    if (this.saving() || this.uploading()) return;
    this.form.markAllAsTouched();
    this.formError.set(null);
    if (this.form.invalid) {
      this.formError.set('Revisa los campos marcados en rojo.');
      return;
    }
    const value = this.form.getRawValue();
    const request: CategoryRequest = {
      name: value.name.trim(),
      slug: value.slug.trim() || null,
      description: value.description.trim() || null,
      imageUrl: value.imageUrl || null,
      parentId: value.parentId,
      active: value.active
    };
    const editing = this.editing();
    const save$ = editing === 'new' || editing === null ? this.api.createCategory(request) : this.api.updateCategory(editing, request);
    this.saving.set(true);
    save$.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false))).subscribe({
      next: (category) => {
        this.notice.set(editing === 'new' ? `Categoría «${category.name}» creada.` : 'Cambios guardados.');
        this.editing.set(null);
        this.load();
      },
      error: (error: unknown) => {
        for (const [field, message] of Object.entries(apiFieldErrors(error))) {
          const control = this.form.get(field);
          control?.setErrors({ ...control.errors, server: message });
          control?.markAsTouched();
        }
        this.formError.set(adminErrorMessage(error, 'No se pudo guardar la categoría.'));
      }
    });
  }

  protected move(row: CategoryRow, offset: number): void {
    const target = row.index + offset;
    if (this.busy() || target < 0 || target >= row.siblingIds.length) return;
    const ids = [...row.siblingIds];
    [ids[row.index], ids[target]] = [ids[target], ids[row.index]];
    this.busy.set(true);
    this.resetMessages();
    this.api.reorderCategories(row.category.parentId, ids)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))).subscribe({
        next: (categories) => this.categories.set(categories),
        error: (error: unknown) => this.actionError.set(adminErrorMessage(error, 'No se pudo cambiar el orden.'))
      });
  }

  protected remove(category: AdminCategory): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.resetMessages();
    this.api.deleteCategory(category.id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => {
      this.busy.set(false);
      this.confirmDelete.set(null);
    })).subscribe({
      next: (message) => {
        this.notice.set(message);
        if (this.editing() === category.id) this.editing.set(null);
        this.load();
      },
      error: (error: unknown) => this.actionError.set(adminErrorMessage(error, 'No se pudo borrar la categoría.'))
    });
  }

  protected chooseImage(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES) {
      this.formError.set('La imagen tiene que ser JPG, PNG o WebP de hasta 5 MB.');
      return;
    }
    this.uploading.set(true);
    this.formError.set(null);
    this.api.uploadImage(file, 'CATEGORIES').pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (uploaded) => this.form.controls.imageUrl.setValue(uploaded.url),
        error: (error: unknown) => this.formError.set(adminErrorMessage(error, 'No se pudo subir la imagen.'))
      });
  }

  protected errorFor(field: string): string | null {
    const control = this.form.get(field);
    if (!control || !control.touched || !control.errors) return null;
    if (control.hasError('server')) return control.getError('server');
    if (control.hasError('required')) return 'Obligatorio';
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres`;
    return 'Valor no válido';
  }

  private resetMessages(): void {
    this.notice.set(null);
    this.actionError.set(null);
    this.confirmDelete.set(null);
  }

  private focusEditor(): void {
    // Tras pintar el editor: en pantallas estrechas queda debajo del árbol.
    setTimeout(() => this.editorRef()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }
}
