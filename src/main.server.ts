// en este archivo se define el punto de entrada para la aplicación Angular en el entorno del servidor. Se importa la función bootstrapApplication desde @angular/platform-browser, que se utiliza para iniciar la aplicación Angular. También se importa el componente raíz App y la configuración específica para el entorno del servidor desde app.config.server. La función bootstrap se define para recibir un contexto de arranque y luego llama a bootstrapApplication con el componente raíz, la configuración y el contexto. Finalmente, se exporta la función bootstrap como el valor predeterminado del módulo.
import 'zone.js/node';
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
