import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { AppTheme } from '../models/theme.model';

// este servicio se encarga de gestionar el tema de la aplicación (claro u oscuro) y de persistir la preferencia del usuario en el almacenamiento local del navegador. También aplica el tema seleccionado al documento HTML para que los estilos correspondientes se apliquen en toda la aplicación. @injectable se utiliza para marcar esta clase como un servicio que puede ser inyectado en otros componentes o servicios de Angular. El servicio expone un observable currentTheme$ para que los componentes puedan suscribirse a los cambios de tema y actualizar su apariencia en consecuencia. de lo contrario, si el usuario no ha seleccionado un tema, se detecta la preferencia del sistema operativo utilizando la consulta de medios (prefers-color-scheme) y se establece el tema inicial en consecuencia.
@Injectable({
  providedIn: 'root'
})

// El servicio de tema se encarga de gestionar el tema actual de la aplicación (claro u oscuro) y de persistir la preferencia del usuario en el almacenamiento local del navegador. También aplica el tema seleccionado al documento HTML para que los estilos correspondientes se apliquen en toda la aplicación.
export class ThemeService {
  private readonly document = inject(DOCUMENT); // Inyecta el objeto DOCUMENT para manipular el documento HTML. private readonly es una forma de declarar una propiedad de solo lectura que se inicializa en el constructor. Esto garantiza que la referencia al documento no pueda ser modificada después de la creación del servicio. inject(DOCUMENT) es una función de Angular que se utiliza para inyectar el objeto DOCUMENT, que representa el documento HTML en el que se ejecuta la aplicación. Esto permite al servicio manipular el documento para aplicar el tema seleccionado.
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly themeKey = 'transitops_theme'; // Clave utilizada para almacenar la preferencia de tema en el almacenamiento local del navegador.

  // BehaviorSubject para mantener el estado actual del tema y permitir que los componentes se suscriban a los cambios de tema. Se inicializa con el tema obtenido de getInitialTheme(), que determina el tema inicial basado en la preferencia almacenada o la preferencia del sistema operativo. BehaviorSubject es una clase de RxJS que permite emitir valores a los suscriptores y mantener el último valor emitido. En este caso, se utiliza para mantener el estado actual del tema y permitir que los componentes se suscriban a los cambios de tema. <AppTheme> es una anotación de tipo que indica que el valor emitido por el BehaviorSubject debe ser del tipo AppTheme, que es un tipo personalizado que representa los posibles temas (light o dark) de la aplicación.
  private readonly currentThemeSubject = new BehaviorSubject<AppTheme>(
    this.getInitialTheme()
  );

  // Observable público que los componentes pueden suscribirse para recibir actualizaciones del tema actual. currentTheme$ es un observable que emite el valor actual del tema cada vez que cambia. Los componentes pueden suscribirse a este observable para actualizar su apariencia en función del tema seleccionado.
  currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    this.applyTheme(this.currentThemeSubject.value);
  }

  getCurrentTheme(): AppTheme {
    return this.currentThemeSubject.value;
  }

  toggleTheme(): void {
    const nextTheme: AppTheme =
      this.currentThemeSubject.value === 'light' ? 'dark' : 'light';

    this.setTheme(nextTheme);
  }

  setTheme(theme: AppTheme): void {
    if (this.isBrowser) {
      localStorage.setItem(this.themeKey, theme);
    }

    this.currentThemeSubject.next(theme);
    this.applyTheme(theme);
  }

  private getInitialTheme(): AppTheme {
    if (!this.isBrowser) {
      return 'light';
    }

    const storedTheme = localStorage.getItem(this.themeKey);

    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }

    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

    return prefersDark ? 'dark' : 'light';
  }

  private applyTheme(theme: AppTheme): void {
    const root = this.document.documentElement;

    root.setAttribute('data-theme', theme);
    root.setAttribute('data-bs-theme', theme);
  }
}