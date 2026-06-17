# Diagramas ER de la Base de Datos

El esquema está organizado en seis dominios lógicos. El diagrama siguiente muestra cómo se relacionan a alto
nivel; cada sección posterior profundiza en un dominio con el detalle completo de sus tablas.

```mermaid
flowchart LR
  Users["Usuarios"]
  Catalog["Ofertas"]
  Events["Eventos"]
  Roster["Invitaciones"]
  Confirm["Confirmaciones"]
  Portfolio["Portafolios"]

  Users -->|"crean / importan"| Catalog
  Users -->|"son dueños de"| Events
  Catalog -->|"asignadas a"| Events
  Events -->|"invitan clientes vía"| Roster
  Roster -->|"derivan en"| Confirm
  Catalog -->|"elegido como intereses"| Confirm
  Confirm -->|"generan"| Portfolio
  Events -->|"agrupan"| Portfolio
  Catalog -->|"copiadas como ítems en"| Portfolio
  Users -->|"son dueños / revisan"| Portfolio
```

## Usuarios

```mermaid
flowchart LR
  Admin["Admin"]
  Sales["Vendedor (sales)"]
  Client["Cliente (público)"]

  Usuarios["usuarios"]
  Catalogo["ofertas (catálogo)"]
  Eventos["eventos"]
  Listados["listados"]
  Invitaciones["invitaciones"]
  Plantillas["plantillas de correo"]
  Confirmaciones["confirmaciones"]
  Intereses["intereses"]
  Portafolios["portafolios"]

  Admin -->|"crea y gestiona"| Usuarios
  Admin -->|"administra"| Catalogo
  Admin -->|"accede a todos los"| Eventos

  Sales -->|"adminstra"| Eventos
  Sales -->|"consulta"| Catalogo
  Sales -->|"carga y gestiona"| Listados
  Sales -->|"envía"| Invitaciones
  Sales -->|"redacta"| Plantillas
  Sales -->|"revisa y envía"| Portafolios

  Listados -->|"derivan en"| Invitaciones
  Client -->|"abre con token"| Invitaciones
  Client -->|"reserva y confirma"| Confirmaciones
  Client -->|"elige"| Intereses
  Confirmaciones -->|"registran"| Intereses
  Confirmaciones -.->|"genera (sistema)"| Portafolios

  classDef admin fill:#fde2e2,stroke:#c0392b,color:#000
  classDef sales fill:#e2ecfd,stroke:#2c5fc0,color:#000
  classDef client fill:#e6f7e6,stroke:#2e8b57,color:#000
  class Admin admin
  class Sales sales
  class Client client
```

```mermaid
erDiagram
  users {
    uuid id PK
    string name
    string last_name
    string email UK
    text password_hash
    string role
    string status
    datetime created_at
    datetime updated_at
  }
```

Los clientes son considerados usuarios publicos, no tienen registros en la base de datos.

## Catálogo de Productos y Servicios

```mermaid
erDiagram
  offerings {
    uuid id PK
    string type
    string name
    text description
    decimal base_price
    bool is_active
    datetime created_at
    datetime updated_at
  }
  offering_import_records {
    uuid id PK
    string status
    string file_name
    int processed_count
    int imported_count
    int duplicate_count
    int invalid_count
    json valid_rows
    json invalid_rows
    json duplicate_rows
    uuid created_by FK
    datetime created_at
  }
  users {
    uuid id PK
    string email
  }

  users ||--o{ offering_import_records : "created_by"
```

## Gestión de Eventos Promocionales

```mermaid
erDiagram
  sales_events {
    uuid id PK
    uuid owner_id FK
    string name
    text description
    int capacity
    datetime event_start_date
    datetime event_end_date
    datetime registration_start_date
    datetime registration_end_date
    int reservation_timeout_minutes
    bool require_confirmation
    string status
    datetime created_at
    datetime updated_at
  }
  event_offerings {
    uuid id PK
    uuid event_id FK,UK
    uuid offering_id FK,UK
    uuid assigned_by FK
    datetime assigned_at
  }
  users {
    uuid id PK
    string email
  }
  offerings {
    uuid id PK
    string name
  }

  users ||--o{ sales_events : "es dueño"
  sales_events ||--o{ event_offerings : "asigna"
  offerings ||--o{ event_offerings : "asigna"
  users ||--o{ event_offerings : "asignado por"
```

## Invitaciones de Clientes y Gestión del Listado

```mermaid
erDiagram
  clients {
    uuid id PK
    string email UK
    datetime created_at
  }
  rosters {
    uuid id PK
    uuid event_id FK,UK
    uuid uploaded_by FK
    int total_clients
    datetime created_at
    datetime updated_at
  }
  roster_clients {
    uuid id PK
    uuid roster_id FK,UK
    uuid client_id FK,UK
    string name
    string company
    datetime created_at
  }
  invitations {
    uuid id PK
    uuid event_id FK
    uuid roster_client_id FK,UK
    string token UK
    string status
    datetime sent_at
    datetime opened_at
    datetime confirmed_at
    datetime created_at
    datetime updated_at
  }
  invitation_status_events {
    uuid id PK
    uuid invitation_id FK
    string status
    datetime created_at
  }
  email_templates {
    uuid id PK
    uuid event_id FK,UK
    string name
    string subject
    text html_body
    text text_body
    uuid created_by FK
    datetime created_at
    datetime updated_at
  }
  import_records {
    uuid id PK
    uuid event_id FK
    string status
    string file_name
    int imported_count
    int invalid_count
    int duplicate_count
    int accepted_count
    json valid_rows
    json invalid_rows
    json duplicate_rows
    uuid created_by FK
    datetime created_at
  }
  sales_events {
    uuid id PK
    string name
  }
  users {
    uuid id PK
    string email
  }

  sales_events ||--o| rosters : "tiene"
  users ||--o{ rosters : "uploaded_by"
  rosters ||--o{ roster_clients : "contiene"
  clients ||--o{ roster_clients : "listado como"
  sales_events ||--o{ invitations : "tiene"
  roster_clients ||--o| invitations : "invitado vía"
  invitations ||--o{ invitation_status_events : "historial de estados"
  sales_events ||--o| email_templates : "tiene"
  users ||--o{ email_templates : "creado por"
  sales_events ||--o{ import_records : "tiene"
  users ||--o{ import_records : "creado por"
```

## Confirmación de Asistencia del Cliente y Recolección de Intereses

El flujo paso a paso de este proceso (abrir invitación, reservar asiento, borrador y confirmación) está
documentado en [`flows.md`](./flows.md#confirmación-de-asistencia). Aquí se muestra solo el modelo de datos.

```mermaid
erDiagram
  seat_reservations {
    uuid id PK
    uuid event_id FK
    uuid invitation_id FK
    string status
    datetime expires_at
    datetime created_at
    datetime updated_at
  }
  draft_confirmations {
    uuid id PK
    uuid invitation_id FK,UK
    json data
    datetime created_at
    datetime updated_at
  }
  attendance_confirmations {
    uuid id PK
    uuid event_id FK
    uuid invitation_id FK,UK
    uuid client_id FK
    string first_name
    string last_name
    string email
    datetime attendance_date
    datetime confirmed_at
    datetime created_at
  }
  client_interests {
    uuid id PK
    uuid confirmation_id FK,UK
    uuid offering_id FK,UK
    datetime created_at
  }
  sales_events {
    uuid id PK
    string name
  }
  invitations {
    uuid id PK
    string token
  }
  clients {
    uuid id PK
    string email
  }
  offerings {
    uuid id PK
    string name
  }

  sales_events ||--o{ seat_reservations : "tiene"
  invitations ||--o{ seat_reservations : "retiene"
  invitations ||--o| draft_confirmations : "borradores"
  sales_events ||--o{ attendance_confirmations : "tiene"
  invitations ||--o| attendance_confirmations : "confirmado por"
  clients ||--o{ attendance_confirmations : "confirma"
  attendance_confirmations ||--o{ client_interests : "registra"
  offerings ||--o{ client_interests : "seleccionada"
```

## Gestión de Portafolios Promocionales

```mermaid
erDiagram
  portfolios {
    uuid id PK
    uuid event_id FK
    uuid client_id FK
    uuid attendance_confirmation_id FK,UK
    uuid owner_id FK
    string status
    decimal service_subtotal
    int service_discount_percentage
    decimal service_discount_amount
    decimal service_total_after_discount
    decimal product_subtotal
    int product_discount_percentage
    decimal product_discount_amount
    decimal product_total_after_discount
    decimal total_before_discount
    decimal total_discount_amount
    decimal total_after_discount
    datetime reviewed_at
    uuid reviewed_by FK
    datetime sent_at
    datetime accepted_at
    datetime rejected_at
    datetime closed_at
    datetime created_at
    datetime updated_at
  }
  portfolio_items {
    uuid id PK
    uuid portfolio_id FK
    uuid offering_id FK
    string offering_name
    string offering_type
    decimal base_price
    int discount_percentage
    decimal discount_amount
    decimal final_price
    datetime created_at
    datetime updated_at
  }
  portfolio_status_events {
    uuid id PK
    uuid portfolio_id FK
    string from_status
    string to_status
    uuid changed_by FK
    datetime created_at
  }
  sales_events {
    uuid id PK
    string name
  }
  clients {
    uuid id PK
    string email
  }
  attendance_confirmations {
    uuid id PK
    datetime attendance_date
  }
  offerings {
    uuid id PK
    string name
  }
  users {
    uuid id PK
    string email
  }

  sales_events ||--o{ portfolios : "tiene"
  clients ||--o{ portfolios : "sujeto de"
  attendance_confirmations ||--o| portfolios : "genera"
  users ||--o{ portfolios : "owner"
  users ||--o{ portfolios : "reviewed_by"
  portfolios ||--o{ portfolio_items : "contiene"
  offerings ||--o{ portfolio_items : "instantánea de"
  portfolios ||--o{ portfolio_status_events : "historial de estados"
  users ||--o{ portfolio_status_events : "changed_by"
```
