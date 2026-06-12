import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Carpeta única del logo del negocio (un solo archivo). */
export function obtenerCarpetaLogo(): string {
  const personalizada = process.env.CARPETA_LOGO?.trim();
  if (personalizada) return resolve(personalizada);

  const raizMonorepo = resolve(process.cwd(), '..');
  if (existsSync(resolve(raizMonorepo, 'docker-compose.yml'))) {
    return resolve(raizMonorepo, 'logo');
  }

  return resolve(process.cwd(), 'logo');
}
