import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { LucideMapPin, LucidePencil, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { finalize } from 'rxjs';
import { Address, AddressRequest } from '../../models/address.model';
import { AddressesApiService } from '../../services/addresses-api.service';
import { AccountSessionService } from '../../services/account-session.service';
import { accountErrorMessage, addressFieldError } from '../../utils/account-errors';

const PHONE_PATTERN = /^[0-9 +().-]*$/;
const MAX_ADDRESSES = 20;

function usageSelected(group: AbstractControl): ValidationErrors | null {
  return group.get('usoEnvio')?.value || group.get('usoFacturacion')?.value ? null : { usage: true };
}

@Component({
  selector: 'scw-account-addresses',
  imports: [ReactiveFormsModule, LucideMapPin, LucidePencil, LucidePlus, LucideTrash2],
  templateUrl: './account-addresses.component.html',
  styleUrls: ['../../styles/account-page.scss', './account-addresses.component.scss']
})
export class AccountAddressesComponent implements OnInit {
  private readonly api = inject(AddressesApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly user = inject(AccountSessionService).user;
  protected readonly maxAddresses = MAX_ADDRESSES;
  protected readonly addresses = signal<Address[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Address | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly confirmDelete = signal<number | null>(null);
  protected readonly deleting = signal(false);
  protected readonly errorFor = addressFieldError;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    alias: ['', [Validators.maxLength(100)]],
    nombreDestinatario: ['', [Validators.required, Validators.maxLength(100)]],
    apellidosDestinatario: ['', [Validators.required, Validators.maxLength(150)]],
    telefono: ['', [Validators.maxLength(30), Validators.pattern(PHONE_PATTERN)]],
    calle: ['', [Validators.required, Validators.maxLength(200)]],
    numero: ['', [Validators.required, Validators.maxLength(30)]],
    complemento: ['', [Validators.maxLength(150)]],
    codigoPostal: ['', [Validators.required, Validators.maxLength(20)]],
    localidad: ['', [Validators.required, Validators.maxLength(100)]],
    provincia: ['', [Validators.required, Validators.maxLength(100)]],
    pais: ['España', [Validators.required, Validators.maxLength(100)]],
    usoEnvio: [true],
    usoFacturacion: [false],
    predeterminadaEnvio: [false],
    predeterminadaFacturacion: [false]
  }, { validators: usageSelected });

  ngOnInit(): void {
    this.load();
    // Una dirección solo puede ser la predeterminada de un uso que tenga marcado.
    this.form.controls.usoEnvio.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((enabled) => {
      if (!enabled) this.form.controls.predeterminadaEnvio.setValue(false);
    });
    this.form.controls.usoFacturacion.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((enabled) => {
      if (!enabled) this.form.controls.predeterminadaFacturacion.setValue(false);
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.list().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (addresses) => this.addresses.set(addresses),
      error: (error: unknown) => this.loadError.set(accountErrorMessage(error, 'No se pudieron cargar tus direcciones.'))
    });
  }

  protected openNew(): void {
    const user = this.user();
    const hasDefaultShipping = this.addresses().some((address) => address.predeterminadaEnvio);
    this.form.reset({
      nombreDestinatario: user?.nombre ?? '',
      apellidosDestinatario: user?.apellidos ?? '',
      pais: 'España',
      usoEnvio: true,
      predeterminadaEnvio: !hasDefaultShipping
    });
    this.openForm(null);
  }

  protected openEdit(address: Address): void {
    this.form.reset({
      ...address,
      alias: address.alias ?? '',
      telefono: address.telefono ?? '',
      complemento: address.complemento ?? ''
    });
    this.openForm(address);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
    this.formError.set(null);
  }

  protected save(): void {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.formError.set(null);

    const editing = this.editing();
    const request = this.toRequest();
    const operation = editing ? this.api.update(editing.id, request) : this.api.create(request);
    operation.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.closeForm();
        this.success.set(editing ? 'Dirección actualizada.' : 'Dirección añadida.');
        // Recargar: guardar una predeterminada puede desmarcar otra.
        this.load();
      },
      error: (error: unknown) => this.formError.set(accountErrorMessage(error, 'No se pudo guardar la dirección.'))
    });
  }

  protected remove(address: Address): void {
    if (this.deleting()) return;
    this.deleting.set(true);
    this.success.set(null);
    this.api.remove(address.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.deleting.set(false))
    ).subscribe({
      next: () => {
        this.confirmDelete.set(null);
        this.success.set('Dirección eliminada.');
        this.load();
      },
      error: (error: unknown) => {
        this.confirmDelete.set(null);
        this.loadError.set(accountErrorMessage(error, 'No se pudo eliminar la dirección.'));
      }
    });
  }

  private openForm(address: Address | null): void {
    this.editing.set(address);
    this.formError.set(null);
    this.success.set(null);
    this.confirmDelete.set(null);
    this.formOpen.set(true);
  }

  private toRequest(): AddressRequest {
    const value = this.form.getRawValue();
    const optional = (text: string) => text.trim() || undefined;
    return {
      alias: optional(value.alias),
      nombreDestinatario: value.nombreDestinatario.trim(),
      apellidosDestinatario: value.apellidosDestinatario.trim(),
      telefono: optional(value.telefono),
      calle: value.calle.trim(),
      numero: value.numero.trim(),
      complemento: optional(value.complemento),
      codigoPostal: value.codigoPostal.trim(),
      localidad: value.localidad.trim(),
      provincia: value.provincia.trim(),
      pais: value.pais.trim(),
      usoEnvio: value.usoEnvio,
      usoFacturacion: value.usoFacturacion,
      predeterminadaEnvio: value.usoEnvio && value.predeterminadaEnvio,
      predeterminadaFacturacion: value.usoFacturacion && value.predeterminadaFacturacion
    };
  }
}
