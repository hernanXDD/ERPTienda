const JWT_SECRETO_EJEMPLO = 'cambiar-por-secreto-largo-y-aleatorio-en-produccion';

/**
 * Valida variables de entorno al arrancar la API.
 * En producción exige JWT fuerte y orígenes CORS explícitos.
 */
export function validarVariablesEntorno(config: Record<string, unknown>): Record<string, unknown> {
  const nodeEnv = String(config.NODE_ENV ?? 'development').trim();
  const errores: string[] = [];

  const databaseUrl = String(config.DATABASE_URL ?? '').trim();
  if (!databaseUrl) {
    errores.push('DATABASE_URL es obligatorio.');
  } else if (
    !databaseUrl.startsWith('postgresql://') &&
    !databaseUrl.startsWith('postgres://')
  ) {
    errores.push('DATABASE_URL debe ser una URL de PostgreSQL.');
  }

  const jwtSecreto = String(config.JWT_SECRETO ?? '').trim();
  if (!jwtSecreto) {
    errores.push('JWT_SECRETO es obligatorio.');
  } else if (nodeEnv === 'production') {
    if (jwtSecreto.length < 32) {
      errores.push('JWT_SECRETO debe tener al menos 32 caracteres en producción.');
    }
    if (jwtSecreto === JWT_SECRETO_EJEMPLO) {
      errores.push('JWT_SECRETO no puede ser el valor de ejemplo en producción.');
    }
  }

  const corsOrigenes = String(config.CORS_ORIGENES ?? '').trim();
  if (nodeEnv === 'production' && !corsOrigenes) {
    errores.push('CORS_ORIGENES es obligatorio en producción (URLs separadas por coma).');
  }

  const puerto = Number(config.PUERTO ?? 3000);
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    errores.push('PUERTO debe ser un entero entre 1 y 65535.');
  }

  if (errores.length > 0) {
    throw new Error(`Configuración de entorno inválida:\n- ${errores.join('\n- ')}`);
  }

  return config;
}
