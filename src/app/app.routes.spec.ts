import { routes } from './app.routes';
import { LoginComponent } from './features/access/Login/LoginComponent';
import { BaseComponent } from './layout/base/BaseComponent';

describe('App Routing', () => {
  it('should be defined', () => {
    expect(routes).toBeDefined();
    expect(Array.isArray(routes)).toBe(true);
  });

  describe('Root path', () => {
    it('should redirect empty path to login', () => {
      const rootRoute = routes.find(route => route.path === '');

      expect(rootRoute).toBeDefined();
      expect(rootRoute?.pathMatch).toBe('full');
      expect(rootRoute?.redirectTo).toBe('login');
    });
  });

  describe('Login route', () => {
    it('should have login route with LoginComponent', () => {
      const loginRoute = routes.find(route => route.path === 'login');

      expect(loginRoute).toBeDefined();
      expect(loginRoute?.component).toBe(LoginComponent);
    });
  });

  describe('Base layout routes', () => {
    let baseRoute: any;

    beforeEach(() => {
      baseRoute = routes.find(route => route.path === '' && route.component === BaseComponent);
    });

    it('should have base route with BaseComponent', () => {
      expect(baseRoute).toBeDefined();
      expect(baseRoute?.component).toBe(BaseComponent);
    });

    it('should have children routes defined', () => {
      expect(baseRoute?.children).toBeDefined();
      expect(Array.isArray(baseRoute?.children)).toBe(true);
      expect(baseRoute?.children?.length).toBe(4);
    });

    describe('Child routes', () => {
      const expectedRoutes = [
        { path: 'data-explorer', modulePath: './features/DataExplorerModule/data-explorer.module' },
        { path: 'visualization', modulePath: './features/VisualizationsModule/visualizations.module' },
        { path: 'analysis-tools', modulePath: './features/AnalysisToolsModule/analysis-tools.module' },
        { path: 'filter-manager', modulePath: './features/FilterManagerModule/filter-manager.module' }
      ];

      expectedRoutes.forEach(expectedRoute => {
        describe(`${expectedRoute.path} route`, () => {
          let childRoute: any;

          beforeEach(() => {
            childRoute = baseRoute?.children?.find((child: any) => child.path === expectedRoute.path);
          });

          it(`should have ${expectedRoute.path} route`, () => {
            expect(childRoute).toBeDefined();
          });

          it(`should have lazy loading for ${expectedRoute.path}`, () => {
            expect(childRoute?.loadChildren).toBeDefined();
            expect(typeof childRoute?.loadChildren).toBe('function');
          });

          it(`should point to correct module for ${expectedRoute.path}`, () => {
            // Inspect the original lazy import function string to verify the module path
            const originalImport = childRoute.loadChildren;
            const functionString = originalImport?.toString() ?? '';
            expect(functionString).toContain(expectedRoute.modulePath);
          });
        });
      });
    });
  });

  describe('Route configuration completeness', () => {
    it('should have exactly 3 top-level routes', () => {
      expect(routes.length).toBe(3); // '', 'login', and '' with component
    });

    it('should not have any undefined or null routes', () => {
      routes.forEach(route => {
        expect(route).toBeDefined();
        expect(route).not.toBeNull();
      });
    });
  });

  describe('Lazy loading functions', () => {
    const mockModules = {
      DataExplorerModule: {},
      VisualizationsModule: {},
      AnalysisToolsModule: {},
      FilterManagerModule: {}
    };

    // Mock the import function to provide the named exports expected by loadChildren
    jest.mock('./features/DataExplorerModule/data-explorer.module', () => ({
      DataExplorerModule: {}
    }));
    jest.mock('./features/VisualizationsModule/visualizations.module', () => ({
      VisualizationsModule: {}
    }));
    jest.mock('./features/AnalysisToolsModule/analysis-tools.module', () => ({
      AnalysisToolsModule: {}
    }));
    jest.mock('./features/FilterManagerModule/filter-manager.module', () => ({
      FilterManagerModule: {}
    }));

    it('should correctly resolve lazy loaded modules', async () => {
      const baseRoute = routes.find(route => route.path === '' && route.component === BaseComponent);

      for (const childRoute of baseRoute?.children || []) {
        if (childRoute.loadChildren) {
          // This will test that the import function works without throwing errors
          await expect(childRoute.loadChildren()).resolves.toBeDefined();
        }
      }
    });
  });

});
