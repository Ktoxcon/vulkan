# Flujos del Sistema

Diagramas de los flujos principales (secuencia y estados).

## Tabla de Contenidos

- [Configuración del evento](#configuración-del-evento) catálogo, asignación de ofertas y activación.
- [Listado e invitaciones](#listado-e-invitaciones) carga de clientes y envío de correos.
- [Acceso público por token](#acceso-público-por-token) cómo se valida el token y la elegibilidad.
- [Confirmación de asistencia](#confirmación-de-asistencia) flujo público del cliente, vía token.
- [Gestión del portafolio](#gestión-del-portafolio) revisión, envío y cambios de estado.

## Configuración del evento

Preparación del evento por parte del staff: el **admin** mantiene el catálogo (solo lectura para el vendedor)
y el **vendedor** crea su evento, le asigna ofertas, redacta la plantilla de correo y lo activa. La activación
requiere pasar las verificaciones de _readiness_; recién ahí los tokens de invitación quedan habilitados.

```mermaid
sequenceDiagram
  autonumber
  actor Adm as Admin
  actor Sal as Vendedor (sales)
  participant API as API / Sistema
  participant DB as Base de datos

  Note over Adm,DB: 1. Catálogo (solo admin)
  Adm->>API: POST / PATCH / DELETE /offerings
  API->>DB: Crear o editar offerings (productos y servicios)

  Note over Sal,DB: 2. Crear evento
  Sal->>API: POST /events
  API->>DB: Crear sales_event (status=draft, owner=vendedor)

  Note over Sal,DB: 3. Asignar ofertas al evento
  Sal->>API: POST /events/:eventId/offerings
  API->>API: Validar que la oferta esté activa y no duplicada
  API->>DB: Crear event_offering

  Note over Sal,DB: 4. Plantilla de correo
  Sal->>API: Guardar la plantilla de correo del evento
  API->>DB: Upsert email_template

  Note over Sal,DB: 5. Activar evento
  Sal->>API: PATCH /events/:eventId (status=active)
  API->>API: Evaluar readiness (ofertas, plantilla, listado, invitaciones, fechas)
  alt Evento listo
    API->>DB: status=active, habilitar tokens de invitaciones
    API-->>Sal: Evento activo
  else No listo
    API-->>Sal: Error: evento no está listo (checks pendientes)
  end
```

## Listado e invitaciones

El vendedor carga el listado de clientes (CSV o alta manual), genera las invitaciones con su token único y las
envía por correo de forma asíncrona. La importación solo se permite con el evento en `draft`.

```mermaid
sequenceDiagram
  autonumber
  actor Sal as Vendedor (sales)
  participant API as API / Sistema
  participant DB as Base de datos
  participant Q as Cola / Worker

  Note over Sal,DB: 1. Importar listado (CSV) — evento en draft
  Sal->>API: POST /events/:eventId/roster-imports (archivo CSV)
  API->>API: Clasificar filas (válidas / inválidas / duplicadas)
  API->>DB: Crear import_record (status=pending, con conteos y filas)
  API-->>Sal: Previsualización del import

  Note over Sal,DB: 2. Confirmar import
  Sal->>API: PATCH /events/:eventId/roster-imports/:importId
  API->>DB: Crear clients + roster + roster_clients, import=confirmed
  Note right of Sal: Alternativa: POST /events/:eventId/roster-clients (alta manual)

  Note over Sal,DB: 3. Generar invitaciones
  Sal->>API: POST /events/:eventId/invitations
  API->>DB: Generar tokens, crear invitations (pending) + invitation_status_events

  Note over Sal,Q: 4. Enviar invitaciones
  Sal->>API: POST /events/:eventId/invitation-dispatches
  API->>API: Verificar que exista plantilla e invitaciones pendientes
  API->>Q: Encolar correos por lotes
  API->>DB: invitations = QUEUED
  Q->>DB: El worker envía cada correo → invitations = SENT
  Note over Q,DB: Al abrir el correo, el pixel marca invitations = OPENED

  Note over Sal,DB: 5. Monitorear progreso
  Sal->>API: GET /events/:eventId/invitation-dispatches/:id
  API-->>Sal: Conteos por estado (pending, queued, sent, opened, confirmed, failed)
```

## Confirmación de asistencia

Flujo público (sin autenticación, vía token de la invitación)

```mermaid
sequenceDiagram
  autonumber
  actor C as Cliente (público)
  participant API as API / Sistema
  participant DB as Base de datos
  participant Q as Cola de trabajos

  Note over C,API: 1. Abrir invitación
  C->>API: GET /invitations/:token
  API->>DB: Resolver token (invitación, evento, ofertas)
  DB-->>API: Invitación + ofertas asignadas + fechas válidas
  API-->>C: Datos del evento y ofertas disponibles

  Note over C,API: 2. Reservar asiento (retención temporal)
  C->>API: POST /invitations/:token/reservation
  API->>DB: Bloquear evento y verificar capacidad
  alt Hay cupo
    API->>DB: Crear seat_reservation (expires_at), invitación = STARTED
    API->>Q: Encolar expiración (delay hasta expires_at)
    API-->>C: Reserva activa (con vencimiento)
  else Sin cupo
    API-->>C: Error: capacidad alcanzada
  end

  Note over C,API: 3. Guardar borrador (autoguardado, opcional)
  C->>API: PUT /invitations/:token/draft
  API->>DB: Upsert draft_confirmations.data (JSON)
  API-->>C: Borrador guardado

  Note over C,API: 4. Confirmar asistencia
  C->>API: POST /invitations/:token/confirmation (datos + offeringIds)
  API->>API: Validar email, fecha y que las ofertas sean seleccionables
  alt Reserva vigente y con cupo
    API->>DB: Crear attendance_confirmation
    API->>DB: Crear client_interests (ofertas elegidas)
    API->>DB: Generar portfolio + portfolio_items (con precios)
    API->>DB: Reserva = CONFIRMED, invitación = CONFIRMED, borrar borrador
    API->>Q: Encolar notificación al dueño del evento
    API-->>C: Confirmación exitosa + resumen de intereses
  else Reserva expirada
    API-->>C: Error: reserva expirada
  end

  Note over Q,DB: Si el cliente no confirma a tiempo, el job de expiración libera el asiento
```

### Acceso público por token

El cliente no inicia sesión: el `token` de la invitación **es la credencial**. Se genera con 256 bits de
aleatoriedad, es **único e indexado** en `invitations.token` y viaja en el
enlace del correo. Todas las rutas bajo `/invitations/:token` son **públicas** (sin `AuthMiddleware`): quien
tenga el token puede operar sobre esa invitación.

En cada petición, antes de actuar, el sistema valida el formato del token, lo resuelve contra la base y aplica
una **puerta de elegibilidad**. Además, al confirmar, el email enviado debe coincidir con el del cliente
invitado (vincula el token a la persona). El token **no tiene expiración propia**: su validez está acotada por
el estado del evento y la ventana de registro, y por el uso único (una vez confirmada, no se reutiliza).

```mermaid
flowchart TD
  A["Petición pública a /invitations/:token"] --> B{"¿Formato de token válido? (base64url)"}
  B -- no --> E1["400 — token mal formado"]
  B -- sí --> C{"¿El token existe? (findByToken)"}
  C -- no --> E2["InvalidTokenError"]
  C -- sí --> D{"¿Ya fue confirmada?"}
  D -- sí --> E3["AlreadyConfirmedError (uso único)"]
  D -- no --> F{"¿Evento en pausa?"}
  F -- sí --> E4["EventPausedError"]
  F -- no --> G{"¿Registro ya inició?"}
  G -- no --> E5["RegistrationNotStartedError"]
  G -- sí --> H{"¿Registro abierto y evento activo?"}
  H -- no --> E6["RegistrationClosedError"]
  H -- sí --> I{"¿Hay cupo disponible?"}
  I -- no --> E7["CapacityReachedError"]
  I -- sí --> OK["Elegible puede continuar (reservar / confirmar)"]
```

## Gestión del portafolio

El portafolio se crea automáticamente al confirmar el cliente (en estado `draft`). A partir de ahí, el
**vendedor dueño** (o un **admin**) lo revisa, lo envía y registra el desenlace. Cada cambio de estado valida
la transición permitida y queda asentado en `portfolio_status_events`.

```mermaid
sequenceDiagram
  autonumber
  actor Sal as Vendedor dueño / Admin
  participant API as API / Sistema
  participant DB as Base de datos

  Note over API,DB: El portafolio ya existe (creado al confirmar, status=draft)
  Sal->>API: GET /events/:eventId/portfolios
  API-->>Sal: Lista de portafolios del evento
  Sal->>API: GET /portfolios/:portfolioId
  API-->>Sal: Detalle + portfolio_items (precios e ítems)

  Sal->>API: PATCH /portfolios/:portfolioId/status (nuevo estado)
  API->>API: Validar transición permitida
  alt Transición válida
    API->>DB: Actualizar status + timestamp, crear portfolio_status_event
    API-->>Sal: Portafolio actualizado
  else Transición inválida
    API-->>Sal: Error: transición no permitida
  end

  Sal->>API: GET /portfolios/:portfolioId/export
  API-->>Sal: Exportación del portafolio
```

Ciclo de vida del estado del portafolio (transiciones permitidas):

```mermaid
stateDiagram-v2
  [*] --> draft: confirmación del cliente
  draft --> reviewed: revisar
  reviewed --> sent: enviar
  sent --> accepted: aceptar
  sent --> rejected: rechazar
  accepted --> closed: cerrar
  rejected --> closed: cerrar
  closed --> [*]
```
