# Decisiones

## ADR-001: Ampliación a una plataforma administrativa

### Estado

Aceptada

### Contexto

El alcance inicial del proyecto estaba limitado al flujo de invitación a eventos, selección de intereses por parte del cliente y notificación al equipo  
de ventas. Sin embargo, este flujo dependía de información relacionada con usuarios, productos, portafolios y eventos. Si estos elementos se manejaban  
de forma estática o manual, el sistema sería más difícil de probar y menos flexible ante futuros cambios.

### Problema a resolver

El sistema necesitaba evitar que la información principal del negocio quedara quemada en el código o dependiera de configuraciones  
manuales. Además, era necesario permitir que los datos relacionados con eventos, productos, portafolios y usuarios pudieran gestionarse  
desde la plataforma, sin requerir cambios constantes en el código fuente.

### Decisión

Se decidió ampliar el alcance técnico del proyecto y modelarlo como una plataforma administrativa más completa, agregando módulos como:

- usuarios
- productos
- portafolios
- otros elementos relacionados.

Esta decisión permite que el flujo de invitaciones y confirmación se apoye en datos administrables dentro del sistema, en lugar de depender de valores  
fijos o configuraciones externas.

### Alternativas consideradas

- **Construir únicamente el flujo mínimo:** habría reducido el tiempo de desarrollo y entrega de la prueba, pero limitaría la flexibilidad del sistema.
- **Usar datos estáticos o hardcodeados:** sería más rápido inicialmente, pero dificultaría el mantenimiento y la evolución del proyecto.
- **Administrar datos manualmente en base de datos:** evitaría construir interfaces adicionales, pero aumentaría el riesgo de errores y dificulta la demostración.

### Consecuencias

#### Positivas

- Mayor flexibilidad para administrar eventos, productos y portafolios.
- Menor dependencia de cambios directos en el código.
- Modelo de datos más alineado con el dominio real del negocio.
- Mejor base para futuras funcionalidades.
- Mayor autonomía para usuarios administrativos.
- Facilidad de demostración.

#### Negativas

- Aumenta el alcance del proyecto.
- Requiere más tiempo de desarrollo y entrega de la prueba.
- Agrega más módulos que mantener.
- Puede ser más complejo de lo necesario para la primera versión.
- Agrega más carga de pruebas.

## ADR-002: Uso de PostgreSQL como base de datos

### Estado

Aceptada

### Contexto

El proyecto es una plataforma de administración de eventos promocionales. Maneja entidades como usuarios, eventos, invitaciones, productos y portafolios.

### Problema a resolver

El sistema necesita almacenar información relacionada entre múltiples entidades y asegurar la consistencia de los datos. Por ejemplo, un cliente puede ser invitado a un evento,  
y ese evento puede tener productos asociados definidos por representantes de ventas. Por esta razón, se requiere una base de datos que permita modelar relaciones, mantener integridad  
referencial y soportar operaciones transaccionales.

### Decisión

Se decidió utilizar **PostgreSQL** como base de datos principal del proyecto. La base de datos se ejecutará en desarrollo mediante **Docker** y será consumida desde la aplicación usando **Drizzle ORM**.

### Alternativas consideradas

- **MySQL:** alternativa válida, pero PostgreSQL ofrece un ecosistema y opciones de despliegue más alineadas con el proyecto.
- **SQL Server:** requiere más configuración y puede generar mayor dependencia del ecosistema Microsoft.
- **MongoDB/Firebase:** al ser NoSQL, no se ajustan tan bien a un modelo con relaciones claramente definidas.
- **SQLite:** es simple, pero puede quedarse corto al escalar.

### Consecuencias

#### Positivas

- Permite modelar relaciones complejas entre entidades.
- Ofrece transacciones e integridad de datos.
- Es open source y tiene buen soporte en el ecosistema.
- Se integra bien con Docker y Drizzle ORM.
- Facilita una buena experiencia de desarrollo.

#### Negativas

- Puede ser más robusto de lo necesario para una primera versión.
- Requiere configurar y mantener una base de datos relacional.
- Algunas funcionalidades avanzadas podrían no utilizarse inicialmente o nunca.

---

## ADR-003: Uso de BullMQ para manejo de correos y reservas temporales

### Estado

Aceptada

### Contexto

El proyecto permite que los clientes confirmen su asistencia a eventos promocionales mediante un formulario asociado a una invitación.  
Durante este proceso, el sistema debe realizar acciones adicionales como enviar correos de confirmación y manejar reservas temporales  
mientras el cliente completa el formulario. El equipo de ventas tambien debe poder recibir correos de confirmación cuando un client  
confirma su asistencia.

### Problema a resolver

El envío de correos y la gestión de reservas temporales no deberían depender directamente del flujo principal del formulario. Si estas  
tareas se ejecutan de forma síncrona, podrían aumentar el tiempo de respuesta, afectar la experiencia del usuario o generar problemas  
si un servicio externo falla.

Además, las reservas temporales requieren control de tiempo para evitar que espacios, invitaciones o recursos queden bloqueados indefinidamente  
si el cliente no completa el proceso.

### Decisión

Se decidió utilizar **BullMQ** para manejar tareas en segundo plano relacionadas con el envío de correos y la gestión de reservas temporales.
BullMQ permitirá crear colas de trabajo para procesar correos de forma asíncrona y programar tareas con retraso para liberar o invalidar reservas  
temporales cuando sea necesario.

### Alternativas consideradas

- **Procesamiento síncrono:** más simple, pero puede afectar el tiempo de respuesta del formulario y depende directamente de servicios externos.
- **Cron jobs:** útiles para tareas periódicas, pero menos adecuados para trabajos específicos asociados a eventos individuales.
- **SetTimeout en la aplicación:** fácil de implementar, pero poco confiable si el servidor se reinicia o existen múltiples instancias.
- **Servicios externos de colas:** pueden ser robustos, pero agregan dependencia externa y complejidad adicional.

### Consecuencias

#### Positivas

- Mejora el tiempo de respuesta del formulario.
- Permite procesar correos en segundo plano.
- Ayuda a manejar reservas temporales de forma más confiable.
- Permite reintentos en caso de fallos.
- Separa responsabilidades entre el flujo principal y las tareas secundarias.

#### Negativas

- Agrega complejidad al proyecto.
- Requiere configurar y mantener Redis.
- Se deben monitorear las colas y posibles trabajos fallidos.
- Puede ser más infraestructura de la necesaria para una versión inicial.

# Situaciones

## Situación 1: Control de cupos bajo concurrencia

Para evitar que se exceda el cupo de un evento, el sistema usa un **lock pesimista a nivel de fila** dentro de una transacción.

Cuando un cliente intenta reservar o confirmar asistencia:

1. Se abre una transacción.
2. Se bloquea la fila del evento con `SELECT ... FOR UPDATE`.
3. Se calcula el cupo disponible:

```ts
cupos disponibles = capacidad - cupos confirmados - cupos reservados
```

4. Si no hay cupo, la operación se rechaza.
5. Si hay cupo, se crea la reserva o confirmación.
6. Al finalizar la transacción, el lock se libera.

Esto garantiza que dos solicitudes no puedan tomar el último cupo al mismo tiempo. Si varias peticiones llegan para el mismo evento, se procesan una por una.  
Cuando una termina, la siguiente recalcula el cupo con los datos actualizados. Las reservas temporales cuentan contra el cupo mientras están activas.  
Si el cliente no completa el formulario, BullMQ expira la reserva y libera el cupo automáticamente.

### Consideraciones de rendimiento

La solución garantiza que no haya sobre-confirmacion, pero en eventos con mucha afluencia puede generar un cuello de botella, ya que las solicitudes del mismo evento se serializan.

Los principales riesgos son:

- mayor latencia,
- timeouts,
- agotamiento del pool de conexiones,
- y degradación de la API si muchas peticiones esperan el mismo lock.

Para mitigarlo, el lock debe mantenerse lo más corto posible. La transacción debería limitarse a validar cupo e insertar la reserva o confirmación. Tareas como envío de correos, notificaciones o generación de portafolios deberían ejecutarse después del `commit` mediante jobs asíncronos.

## Situación 2: Notificación al equipo de ventas

Cuando un cliente confirma su asistencia, el sistema debe notificar al equipo de ventas con el detalle de los productos y servicios seleccionados para que puedan preparar el portafolio personalizado.

Para evitar que esta notificación bloquee el flujo principal, el sistema la maneja de forma asíncrona usando **BullMQ**.

El flujo es:

1. El cliente confirma su asistencia.
2. Se guardan la confirmación y los intereses seleccionados.
3. Se agrega un job a una cola de notificaciones.
4. Un worker procesa el job y genera la notificación para ventas.

La notificación sí se envía realmente por correo electrónico usando **Nodemailer** con una cuenta de **Gmail** configurada  
mediante **Google App Passwords**. Esto permite notificar al equipo de ventas sin usar proveedores pagos de email transaccional,  
manteniendo el envío desacoplado mediante BullMQ para no bloquear la confirmación del cliente.

## Riesgos y consideraciones

- Requiere Redis y workers activos.
- Se deben registrar errores de notificación.
- La notificación podría procesarse con retraso.
- Usar Gmail y Google App Passwords no escalaria bien.
- Los mensajes de la cola de trabajo deberian procesarse en batches no de forma unitaria.
