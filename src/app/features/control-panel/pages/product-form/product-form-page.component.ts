import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowLeft, LucideChevronLeft, LucideChevronRight, LucideImagePlus, LucideLink, LucidePlus, LucideTrash2, LucideX
} from '@lucide/angular';
import { catchError, concatMap, finalize, forkJoin, from, map, Observable, of, startWith } from 'rxjs';
import { apiFieldErrors } from '../../../../core/utils/api-errors';
import { AdminImage, AdminProduct, AdminVariant, CatalogOptions, ProductRequest, ProductStatusCode } from '../../models/admin.model';
import { AdminApiService } from '../../services/admin-api.service';
import { adminErrorMessage } from '../../utils/admin-errors';

const MAX_IMAGES = 12;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImageItem extends AdminImage {
  /** Identificador local para el seguimiento en la lista mientras se sube. */
  key: string;
  uploading?: boolean;
}

let nextImageKey = 0;

/** Alta y edición de productos con sus variantes e imágenes. */
@Component({
  selector: 'scw-product-form-page',
  imports: [
    ReactiveFormsModule, RouterLink,
    LucideArrowLeft, LucideChevronLeft, LucideChevronRight, LucideImagePlus, LucideLink, LucidePlus, LucideTrash2, LucideX
  ],
  templateUrl: './product-form-page.component.html',
  styleUrls: ['../../styles/panel-page.scss', './product-form-page.component.scss']
})
export class ProductFormPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly top = viewChild<ElementRef<HTMLElement>>('top');

  protected readonly productId = signal<number | null>(null);
  protected readonly options = signal<CatalogOptions | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly images = signal<ImageItem[]>([]);
  protected readonly imageError = signal<string | null>(null);
  protected readonly dragging = signal(false);
  protected readonly confirmDelete = signal(false);
  protected readonly deleting = signal(false);
  protected readonly maxImages = MAX_IMAGES;
  protected readonly uploading = computed(() => this.images().some((image) => image.uploading));

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    slug: ['', [Validators.maxLength(200)]],
    categoryId: this.fb.control<number | null>(null, Validators.required),
    type: ['SEALED', Validators.required],
    status: this.fb.control<ProductStatusCode>('DRAFT', Validators.required),
    description: ['', [Validators.maxLength(4000)]],
    releaseDate: [''],
    variants: this.fb.array([this.variantGroup()])
  });
  protected readonly imageUrl = this.fb.control('', [Validators.pattern(/^https:\/\/\S+$/)]);
  /** Vista previa del slug que generará la API si se deja vacío. */
  protected readonly slugPreview = toSignal(this.form.controls.name.valueChanges.pipe(
    startWith(''),
    map((name) => slugify(name))
  ), { initialValue: '' });

  get variants(): FormArray<FormGroup> {
    return this.form.controls.variants as unknown as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('id');
    const id = param ? Number(param) : null;
    this.productId.set(id !== null && Number.isInteger(id) ? id : null);
    const notice = history.state?.notice;
    if (typeof notice === 'string') this.notice.set(notice);
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    const id = this.productId();
    forkJoin({
      options: this.api.catalogOptions(),
      product: id === null ? of(null) : this.api.product(id)
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false))).subscribe({
      next: ({ options, product }) => {
        this.options.set(options);
        if (product) {
          this.fill(product);
        } else {
          // La categoría es obligatoria: un producto nuevo empieza en "Sin categoría" hasta que se clasifique.
          const fallback = options.categories.find((category) => category.system);
          if (fallback && this.form.controls.categoryId.value === null) this.form.controls.categoryId.setValue(fallback.id);
        }
      },
      error: (error: unknown) => this.loadError.set(error instanceof HttpErrorResponse && error.status === 404
        ? 'Este producto ya no existe.'
        : adminErrorMessage(error, 'No se pudo cargar el formulario.'))
    });
  }

  protected addVariant(): void {
    const first = this.variants.at(0)?.getRawValue();
    this.variants.push(this.variantGroup({ vatRate: first?.vatRate ?? 21, price: first?.price ?? null }));
  }

  protected removeVariant(index: number): void {
    if (this.variants.length > 1) this.variants.removeAt(index);
  }

  protected chooseFiles(input: HTMLInputElement): void {
    if (input.files) this.upload(Array.from(input.files));
    input.value = '';
  }

  protected drop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (event.dataTransfer?.files) this.upload(Array.from(event.dataTransfer.files));
  }

  protected addImageUrl(): void {
    const url = this.imageUrl.value.trim();
    if (!url || this.imageUrl.invalid) {
      this.imageUrl.markAsTouched();
      return;
    }
    if (this.images().length >= MAX_IMAGES) {
      this.imageError.set(`Máximo ${MAX_IMAGES} imágenes por producto.`);
      return;
    }
    this.images.update((images) => [...images, { key: `img-${nextImageKey++}`, url, altText: null }]);
    this.imageUrl.reset('');
  }

  protected moveImage(index: number, offset: number): void {
    this.images.update((images) => {
      const target = index + offset;
      if (target < 0 || target >= images.length) return images;
      const next = [...images];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  protected removeImage(key: string): void {
    this.images.update((images) => images.filter((image) => image.key !== key));
  }

  protected setAltText(key: string, altText: string): void {
    this.images.update((images) => images.map((image) => image.key === key ? { ...image, altText } : image));
  }

  protected submit(): void {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    this.error.set(null);
    this.notice.set(null);
    if (this.uploading()) {
      this.error.set('Espera a que terminen de subirse las imágenes.');
      return;
    }
    if (this.form.invalid) {
      this.error.set('Revisa los campos marcados en rojo.');
      this.scrollTop();
      return;
    }
    this.saving.set(true);
    const id = this.productId();
    const request = this.request();
    const save$: Observable<AdminProduct> = id === null ? this.api.createProduct(request) : this.api.updateProduct(id, request);
    save$.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false))).subscribe({
      next: (product) => {
        if (id === null) {
          void this.router.navigate(['/controlpanel/productos', product.id], {
            replaceUrl: true, state: { notice: 'Producto creado. Puedes seguir editándolo.' }
          });
          return;
        }
        this.fill(product);
        this.notice.set('Cambios guardados.');
        this.scrollTop();
      },
      error: (error: unknown) => {
        this.applyServerErrors(error);
        this.error.set(adminErrorMessage(error, 'No se pudo guardar el producto.'));
        this.scrollTop();
      }
    });
  }

  protected remove(): void {
    const id = this.productId();
    if (id === null || this.deleting()) return;
    this.deleting.set(true);
    this.error.set(null);
    this.api.deleteProduct(id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.deleting.set(false))).subscribe({
      next: () => void this.router.navigate(['/controlpanel/productos']),
      error: (error: unknown) => {
        this.confirmDelete.set(false);
        this.error.set(adminErrorMessage(error, 'No se pudo borrar el producto.'));
        this.scrollTop();
      }
    });
  }

  protected invalid(path: string): boolean {
    const control = this.form.get(path);
    return !!control && control.invalid && control.touched;
  }

  protected errorFor(path: string): string | null {
    const control = this.form.get(path);
    if (!control || !control.touched || !control.errors) return null;
    if (control.hasError('server')) return control.getError('server');
    if (control.hasError('required')) return 'Obligatorio';
    if (control.hasError('min')) return 'No puede ser negativo';
    if (control.hasError('max')) return 'Valor demasiado alto';
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres`;
    if (control.hasError('pattern')) return 'Formato no válido';
    return 'Valor no válido';
  }

  private upload(files: File[]): void {
    this.imageError.set(null);
    const free = MAX_IMAGES - this.images().length;
    if (free <= 0) {
      this.imageError.set(`Máximo ${MAX_IMAGES} imágenes por producto.`);
      return;
    }
    const accepted = files.filter((file) => IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_BYTES).slice(0, free);
    if (accepted.length < files.length) {
      this.imageError.set('Algunos archivos se han descartado: solo JPG, PNG o WebP de hasta 5 MB, y 12 imágenes como máximo.');
    }
    const pending = accepted.map((file) => ({ file, key: `img-${nextImageKey++}` }));
    this.images.update((images) => [...images, ...pending.map(({ key }) => ({ key, url: '', altText: null, uploading: true }))]);
    // Una a una para no saturar la conexión ni la API con fotos grandes.
    from(pending).pipe(
      concatMap(({ file, key }) => this.api.uploadImage(file).pipe(
        map((uploaded) => ({ key, url: uploaded.url, failed: null as string | null })),
        // Un fallo no detiene el resto de la cola.
        catchError((error: unknown) => of({ key, url: '', failed: adminErrorMessage(error, 'No se pudo subir una de las imágenes.') }))
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ key, url, failed }) => {
      if (failed) {
        this.images.update((images) => images.filter((image) => image.key !== key));
        this.imageError.set(failed);
        return;
      }
      this.images.update((images) => images.map((image) => image.key === key ? { ...image, url, uploading: false } : image));
    });
  }

  private fill(product: AdminProduct): void {
    this.productId.set(product.id);
    this.variants.clear();
    product.variants.forEach((variant) => this.variants.push(this.variantGroup(variant)));
    if (this.variants.length === 0) this.variants.push(this.variantGroup());
    this.form.patchValue({
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId,
      type: product.type,
      status: product.status,
      description: product.description ?? '',
      releaseDate: product.releaseDate ?? ''
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.images.set(product.images.map((image) => ({ ...image, key: `img-${nextImageKey++}` })));
  }

  private request(): ProductRequest {
    const value = this.form.getRawValue();
    return {
      name: value.name.trim(),
      slug: value.slug.trim() || null,
      categoryId: value.categoryId as number,
      type: value.type,
      status: value.status,
      description: value.description.trim() || null,
      releaseDate: value.releaseDate || null,
      variants: this.variants.getRawValue().map((variant): AdminVariant => ({
        id: variant['id'] ?? null,
        sku: (variant['sku'] ?? '').trim() || null,
        name: (variant['name'] ?? '').trim(),
        price: Number(variant['price']),
        compareAtPrice: variant['compareAtPrice'] === null || variant['compareAtPrice'] === '' ? null : Number(variant['compareAtPrice']),
        vatRate: Number(variant['vatRate']),
        stockQuantity: Number(variant['stockQuantity']),
        weightGrams: variant['weightGrams'] === null || variant['weightGrams'] === '' ? null : Number(variant['weightGrams']),
        active: !!variant['active']
      })),
      images: this.images().filter((image) => !image.uploading && image.url)
        .map((image) => ({ url: image.url, altText: image.altText?.trim() || null }))
    };
  }

  private variantGroup(variant: Partial<AdminVariant> = {}): FormGroup {
    return this.fb.group({
      id: this.fb.control<number | null>(variant.id ?? null),
      sku: [variant.sku ?? '', [Validators.maxLength(64), Validators.pattern(/^[A-Za-z0-9._-]*$/)]],
      name: [variant.name ?? 'Estándar', [Validators.required, Validators.maxLength(150)]],
      price: this.fb.control<number | null>(variant.price ?? null, [Validators.required, Validators.min(0), Validators.max(99999999)]),
      compareAtPrice: this.fb.control<number | null>(variant.compareAtPrice ?? null, [Validators.min(0)]),
      vatRate: this.fb.control<number | null>(variant.vatRate ?? 21, [Validators.required, Validators.min(0), Validators.max(100)]),
      stockQuantity: this.fb.control<number | null>(variant.stockQuantity ?? 0, [Validators.required, Validators.min(0), Validators.max(1000000)]),
      weightGrams: this.fb.control<number | null>(variant.weightGrams ?? null, [Validators.min(1)]),
      active: [variant.active ?? true]
    });
  }

  /** La API señala los campos como "variants[0].price"; el formulario los busca como "variants.0.price". */
  private applyServerErrors(error: unknown): void {
    for (const [field, message] of Object.entries(apiFieldErrors(error))) {
      const control = this.form.get(field.replace(/\[(\d+)\]/g, '.$1'));
      if (!control) continue;
      control.setErrors({ ...control.errors, server: message });
      control.markAsTouched();
    }
  }

  private scrollTop(): void {
    this.top()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function slugify(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '').slice(0, 200);
}
