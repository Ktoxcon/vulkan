# Vulkan

Este monorepositorio contiene las aplicaciones backend y frontend de Vulkan, la plataforma de administracion de eventos promocionales.

## Requisitos Previos

Para ejecutar el proyecto correctamente, es necesario instalar y configurar algunas herramientas y procesos. A continuación se detallan las herramientas requeridas, las versiones recomendadas y las configuraciones necesarias.

### Herramientas

- **Terminal**  
  Se recomienda utilizar cualquiera de las terminales disponibles en tu sistema operativo.

- **Node.js**  
  Se requiere Node.js versión 18 o superior. Se recomienda usar NVM o una herramienta similar para gestionar diferentes versiones de Node.js.

- **PNPM**  
  Este proyecto es un monorepositorio que contiene tanto el frontend como el backend.
  **Es importante instalar PNPM antes de ejecutar el proyecto.**

  You can install it easily using NPM:

  ```bash
  npm install -g pnpm
  ```

  También puedes consultar la documentación oficial de PNPM para ver las instrucciones específicas según tu sistema operativo.

- **Docker**  
  Es necesario tener Docker instalado y en ejecución para levantar la base de datos del proyecto.

### Variables de entorno y otras herramientas

- **Variables de entorno**  
  Debes crear un archivo `.env` para almacenar valores sensibles, como URLs de conexión, claves de API y otros datos de configuración. Este archivo debe ubicarse en la carpeta raíz de cada aplicación. Puedes usar el archivo `.env.sample` incluido en cada app como referencia.

> [!IMPORTANT]
> El archivo debe llamarse .env, ya que otros nombres no serán detectados por defecto. Si deseas usar varios archivos de entorno, deberás configurar manualmente la aplicación para soportarlos. Este archivo no es rastreado por Git, por lo que puedes incluir tus credenciales allí de forma segura.

### Dependencias del proyecto

Después de instalar las herramientas requeridas y completar la configuración necesaria, debes instalar las dependencias de cada aplicación antes de ejecutarlas. Para hacerlo, ve a la carpeta raíz del proyecto y ejecuta:

```bash
pnpm install
```

Una vez finalizada la instalación, puedes seguir los comandos de la siguiente sección para ejecutar el proyecto.

> [!IMPORTANT]  
> Ten en cuenta que, si no sigues esta guía de requisitos previos, es posible que alguna de las aplicaciones del proyecto no funcione correctamente o no se ejecute.

## Ejecución del proyecto

### Backend (Development)

Para ejecutar la aplicación backend en modo desarrollo, abre tu terminal y ejecuta:

```bash
pnpm backend:dev
```

### Worker (Development)

Para ejecutar la aplicación worker en modo desarrollo, abre tu terminal y ejecuta:

```bash
pnpm worker:dev
```

### Frontend (Development)

Para ejecutar la aplicación frontend en modo desarrollo, abre tu terminal y ejecuta:

```bash
pnpm dev
```

Puedes ejecutar estos comandos desde la carpeta raíz del proyecto o desde la ubicación específica de cada aplicación. Antes de hacerlo, asegúrate de haber configurado correctamente las variables de entorno necesarias en el archivo .env dentro de la carpeta de cada app.

## FAQ

### ¿Por qué el proyecto se llama Vulkan?

El nombre **Vulkan** está inspirado en **Vulkan**, el primarca de los **Salamanders** dentro del universo de [Warhammer 40,000](https://warhammer40000.com/). La referencia  
nace principalmente por la identidad visual del capítulo: sus tonos verdes, negros y detalles cálidos son muy similares a los colores del  
wireframe proporcionado para el proyecto.

Además, debido a la restricción de no utilizar directamente el nombre de la empresa solicitante dentro del proyecto, **Vulkan**  
funcionó como una alternativa con personalidad propia: un nombre corto, memorable y conectado visualmente con la estética  
definida desde el inicio.

Y si la referencia no resulta familiar, puede ser una buena excusa para explorar un poco el universo de [Warhammer 40,000](https://warhammer40000.com/), conocer  
más sobre los [Salamanders](https://warhammer40k.fandom.com/wiki/Salamanders) o descubrir quién es [Vulkan](https://wh40k.lexicanum.com/wiki/Vulkan).

### ¿Por qué usar un monorepositorio?

1. **Gestión centralizada de dependencias**
2. **Proceso de desarrollo más consistente**
3. **CI/CD más sencillo**

### ¿Por qué PNPM?

1. **Eficiencia y optimización**
2. **Instalaciones más rápidas**
3. **Soporte nativo para monorepositorios**
4. **Menos conflictos de versiones**
