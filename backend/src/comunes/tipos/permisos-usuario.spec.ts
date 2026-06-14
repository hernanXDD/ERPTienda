import { RolUsuario } from '@prisma/client';
import {
  menusVisiblesPorDefecto,
  menusVisiblesResueltos,
  permisosOperativosResueltos,
  permisosPorDefectoSegunRol,
} from './permisos-usuario';

describe('permisos-usuario', () => {
  describe('menusVisiblesPorDefecto', () => {
    it('habilita todos los menús principales', () => {
      const menus = menusVisiblesPorDefecto();
      expect(Object.values(menus).every(Boolean)).toBe(true);
      expect(Object.keys(menus)).toHaveLength(8);
    });
  });

  describe('permisosPorDefectoSegunRol', () => {
    it('otorga permisos completos a ADMIN y DUEÑO', () => {
      const admin = permisosPorDefectoSegunRol(RolUsuario.ADMIN);
      const dueno = permisosPorDefectoSegunRol(RolUsuario.DUENO);

      expect(admin.puedeRegistrarVentas).toBe(true);
      expect(dueno.puedeEditarConfiguracionSistema).toBe(true);
    });

    it('restringe permisos operativos a EMPLEADO', () => {
      const empleado = permisosPorDefectoSegunRol(RolUsuario.EMPLEADO);

      expect(empleado.puedeRegistrarVentas).toBe(false);
      expect(empleado.puedeGestionarFichasDeUsuario).toBe(false);
      expect(empleado.menusVisibles.clientes).toBe(true);
    });
  });

  describe('menusVisiblesResueltos', () => {
    it('fusiona overrides parciales con los defaults', () => {
      const menus = menusVisiblesResueltos({ ventas: false, reportes: false });

      expect(menus.ventas).toBe(false);
      expect(menus.reportes).toBe(false);
      expect(menus.clientes).toBe(true);
    });
  });

  describe('permisosOperativosResueltos', () => {
    it('hereda compatibilidad de puedeAjustarStock hacia movimiento manual', () => {
      const permisos = permisosOperativosResueltos(RolUsuario.EMPLEADO, {
        puedeAjustarStock: true,
      });

      expect(permisos.puedeMoverStockManualmente).toBe(true);
    });

    it('respeta permisos almacenados sobre los defaults del rol', () => {
      const permisos = permisosOperativosResueltos(RolUsuario.EMPLEADO, {
        puedeRegistrarVentas: true,
        menusVisibles: menusVisiblesResueltos({ ventas: true }),
      });

      expect(permisos.puedeRegistrarVentas).toBe(true);
      expect(permisos.menusVisibles.ventas).toBe(true);
      expect(permisos.menusVisibles.usuarios).toBe(true);
    });
  });
});
