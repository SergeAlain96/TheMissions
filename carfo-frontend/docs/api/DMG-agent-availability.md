# DMG Agent Availability API

This document specifies the backend endpoints used by the DMG page (`/chauffeurs`) to submit chauffeur availability windows.

## Goals
- Allow DMG to mark drivers (agents with role DRIVER) as available/unavailable for a date range.
- Support bulk submission for efficiency.
- Backend must validate ranges and store availability records (or flags) for scheduling.

## Endpoints

### 1) Submit availability for a single agent
POST /api/agents/{idAgent}/availability

Request body (application/json):
{
  "dateDebut": "YYYY-MM-DD",
  "dateFin": "YYYY-MM-DD",
  "available": true | false
}

Responses:
- 200 OK — { "status": "ok" }
- 400 Bad Request — invalid date range or payload
- 404 Not Found — agent not found
- 500 Internal Server Error — unexpected error

Behavior notes:
- The service should create or update an availability record for the agent over the specified inclusive range.
- If `available` is false, the system may create an "unavailability" record (DMG may use this to block assignment).

---

### 2) Bulk submit availability
POST /api/agents/availability/bulk

Request body (application/json):
[
  {
    "idAgent": 45,
    "dateDebut": "2026-05-10",
    "dateFin": "2026-05-12",
    "available": true
  },
  {
    "idAgent": 46,
    "dateDebut": "2026-05-10",
    "dateFin": "2026-05-12",
    "available": false
  }
]

Responses:
- 200 OK — { "status": "ok", "processed": 2 }
- 207 Multi-Status — partial success; return per-item results
- 400 Bad Request — invalid payload
- 500 Internal Server Error — unexpected error

Behavior notes:
- This endpoint should perform validation per-item and return an aggregated result. Prefer idempotent semantics so repeated POSTs don't duplicate records.

---

## Validation Rules
- `dateDebut` <= `dateFin` (inclusive). Reject otherwise.
- `dateDebut` and `dateFin` must be valid ISO dates.
- Agents must have role DRIVER to be accepted for these endpoints (400 if not driver).

## Recommendation for Implementation
- Store availability as a separate table `agent_availability` with columns: id, id_agent, date_debut, date_fin, available, created_by (DMG user id), created_at.
- Use upsert semantics keyed by `(id_agent, date_debut, date_fin)`.
- When checking driver availability for assignments, combine `agent_availability` and existing `affectations` and `absences` to compute final availability.

## Client usage
- Frontend calls `GET /api/agents?role=DRIVER` to list drivers.
- For each driver, call `GET /api/affectations/check/chauffeur?idChauffeur={id}&dateDebut=...&dateFin=...` to obtain system-computed availability.
- After DMG confirmation, POST selections to either single or bulk endpoints above.

---

Contact: backend team should implement endpoints above; frontend will call them as implemented in `AgentService` (methods `submitAvailability` and `submitBulkAvailability`).