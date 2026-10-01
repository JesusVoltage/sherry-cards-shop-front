export interface User {
  id: number;
  username: string;
  email: string;
  nombre: string;
  apellidos: string | null;
  role: string;
  status: string;
  emailVerifiedAt: string | null;
  lastAccessAt: string | null;
  /** false en cuentas creadas con Google que todavía no tienen contraseña. */
  hasPassword: boolean;
  googleLinked: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  username: string;
  nombre: string;
  apellidos?: string;
}
