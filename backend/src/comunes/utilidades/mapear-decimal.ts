import { Decimal } from '@prisma/client/runtime/library';

export function decimalANumero(valor: Decimal | number): number {
  if (typeof valor === 'number') return valor;
  return valor.toNumber();
}
