export interface Address {
  id: number;
  alias: string | null;
  nombreDestinatario: string;
  apellidosDestinatario: string;
  telefono: string | null;
  calle: string;
  numero: string;
  complemento: string | null;
  codigoPostal: string;
  localidad: string;
  provincia: string;
  pais: string;
  usoEnvio: boolean;
  usoFacturacion: boolean;
  predeterminadaEnvio: boolean;
  predeterminadaFacturacion: boolean;
}

export type AddressRequest = Omit<Address, 'id' | 'alias' | 'telefono' | 'complemento'> & {
  alias?: string;
  telefono?: string;
  complemento?: string;
};
