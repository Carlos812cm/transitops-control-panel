// en este archivo se define el punto de entrada para la aplicación Angular en el entorno del navegador. Se importa la función bootstrapApplication desde @angular/platform-browser, que se utiliza para iniciar la aplicación Angular. También se importa el componente raíz App y la configuración específica para el entorno del navegador desde app.config. La función bootstrapApplication se llama con el componente raíz y la configuración, y se maneja cualquier error que pueda ocurrir durante el proceso de arranque imprimiéndolo en la consola.
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err: unknown) => console.error(err));
