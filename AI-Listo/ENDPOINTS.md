## Required Backend Endpoints

### Auth
- session user injected as `window.__USER__`

### Notifications
GET  /api/crm/notifications
POST /api/crm/notifications/read-all

### Leads
GET    /api/crm/{role}/leads
GET    /api/crm/leads/:id
PATCH  /api/crm/leads/:id
POST   /api/crm/leads/:id/notes
GET    /api/crm/leads/:id/activity

### Pipeline
GET   /api/crm/leads?view=pipeline
PATCH /api/crm/leads/:id

### Properties
GET /api/crm/{role}/properties
GET /api/properties/:id