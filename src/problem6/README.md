# Scoreboard Module Specification

## 1. Assumptions & Constraints

This section outlines the foundational assumptions made during the design of the Scoreboard Module. These assumptions drive the architectural choices regarding security, data flow, and communication protocols.

### 1.1. Decoupled Action Logic (B2B Architecture)

**Assumption:** The system triggering the score update is a separate backend service (e.g., "Game Logic Service" or "Action Engine"), distinct from the client-facing frontend application.

**Rationale:** The prompt states "the action will dispatch an API call." We assume this dispatch occurs server-side to prevent client-side tampering.

**Impact:** The API endpoint designed in this module is a Service-to-Service (B2B) interface. It is not intended to be called directly by user browsers.

### 1.2. Trusted Environment via API Keys

**Assumption:** Communication between the Action Service and the Scoreboard API occurs over a secure internal network or VPN, secured via mutual API Keys.

**Rationale:** Since the client is bypassed for the scoring logic, we do not need to implement complex user-session flows (like OAuth2) for the score update endpoint itself.

**Impact:** Authentication will rely on a static X-API-KEY header or mutual TLS (mTLS), assuming the calling service is trusted to calculate the action correctly.

### 1.3. Unidirectional Data Flow for Updates

**Assumption:** The clients (browser/mobile) only need to receive leaderboard updates and never need to send data through the update channel.

**Rationale:** The requirement is for a "Live update of the score board." There is no requirement for the client to interact with the leaderboard via this stream.

**Impact:** Server-Sent Events (SSE) will be utilized instead of WebSockets. This reduces complexity by maintaining a standard HTTP connection rather than a bi-directional socket connection.

### 1.4. Score Calculation is Externalized

**Assumption:** This module is responsible for aggregating and serving scores, not calculating the logic of "how much" an action is worth.

**Rationale:** To keep this module focused, we assume the calling service knows the point value of the action (or sends the action ID, and this module looks it up).

**Impact:** The API will accept an action_id or a pre-calculated score_increment (validated via a lookup table), ensuring that the Scoreboard service acts as the single source of truth.

---

## 2. API Specification

This module exposes three primary endpoints designed for high-throughput score ingestion and real-time broadcasting.

### 2.1. Update User Score

This is a secure **Server-to-Server** endpoint. It is called by the Action Service upon successful completion of a user action.

- **Endpoint:** `POST /scores`
- **Description:** Increments a specific user's score based on the provided action.
- **Authentication:** Required (`X-API-KEY`)

#### Request Headers

| Key | Value | Description |
| --- | --- | --- |
| `Content-Type` | `application/json` | |
| `X-API-KEY` | `<SECRET_KEY>` | Shared secret for internal service authentication. |

#### Request Body

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "action_id": "complete_level_5"
}
```

#### Logic Requirements

1. Verify the X-API-KEY
2. Lookup the point value associated with action_id (e.g., from a configuration table)
3. Increment the user's score in the database
4. Trigger the Live Update event to broadcast the new leaderboard

#### Response Codes

| Code | Description |
| --- | --- |
| `200 OK` | Score successfully updated. |
| `401 Unauthorized` | Missing or invalid API Key. |
| `400 Bad Request` | Invalid user_id or action_id format. |
| `422 Unprocessable Entity` | action_id does not exist in the score configuration. |

#### Response Body

```json
{
  "status": "success",
  "new_score": 150
}
```

### 2.2. Get Leaderboard (Snapshot)

Used by the frontend to fetch the current leaderboard state upon initial page load.

- **Endpoint:** `GET /leaderboard`
- **Description:** Retrieves the top N users by score.
- **Authentication:** None (Public read access)

#### Query Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `limit` | Integer | 10 | Number of top records to return. |

#### Response Codes

| Code | Description |
| --- | --- |
| `200 OK` | Successfully retrieved. |

#### Response Body

```json
{
  "data": [
    {
      "rank": 1,
      "user_id": "user_123",
      "username": "PlayerOne",
      "score": 500
    },
    {
      "rank": 2,
      "user_id": "user_456",
      "username": "PlayerTwo",
      "score": 450
    }
  ],
  "timestamp": "2023-10-27T10:00:00Z"
}
```

### 2.3. Live Score Stream (SSE)

Used by the frontend to maintain a live connection for real-time updates.

- **Endpoint:** `GET /leaderboard/stream`
- **Description:** Opens a Server-Sent Events stream to push leaderboard updates whenever scores change.
- **Protocol:** `text/event-stream`

#### Client Behavior

The client must handle standard SSE reconnection logic if the connection drops.

#### Server Event Format

- **Event Name:** `leaderboard_update`
- **Data:** JSON Array of the Top 10 (same format as section 2.2)

#### Example Stream Output

```
event: leaderboard_update
data: {"data": [{"rank": 1, "user_id": "...", "username": "...", "score": 500}], "timestamp": "2023-10-27T10:00:00Z"}
```

---

## 3. System Execution Flow

The following sequence illustrates the lifecycle of a user action, the secure backend score update, and the subsequent live update broadcast to the frontend.

[Diagram](Diagram.svg)

### Flow Steps

1. **User Interaction:** User completes an action in the frontend
2. **Frontend Request:** Frontend sends `POST /api/execute-action` to Action Service
3. **Secure Backend Update:** Action Service calls `POST /scores` with `X-API-KEY` header
4. **Score Service Processing:**
   - Verifies API key
   - Increments user score in database (Redis)
   - Fetches Top 10 leaderboard
5. **Live Broadcast:** Score Service publishes update event to SSE stream
6. **Client Update:** Frontend receives leaderboard_update event and updates UI

### Data Flow Diagram Description

```
User → Frontend → Action Service → Score Service → Database (Redis)
                                       ↓
                                   SSE Stream → Frontend → User UI
```

#### Flow Diagram Breakdown

- **B2B Handshake:** The Action Service communicates directly with the Score Service. The frontend is bypassed for scoring logic, ensuring security.
- **Database Interaction:** Atomic operations (increment and rank retrieval) happen on the datastore.
- **Push Mechanism:** The SSE stream pushes data to the frontend without the frontend needing to poll for updates.

---

## 4. Recommendations & Future Improvements

While the specification above fulfills the immediate requirements, the following improvements should be considered for v2 or for a production-grade environment to ensure scalability and data integrity.

### 4.1. Idempotency & Duplicate Handling

**Observation:** Network timeouts can occur. If the Action Service sends a score update but receives a timeout response, it might retry the request. Without protection, this could result in double points for a single action.

**Recommendation:**

- Add an Idempotency-Key (or a unique request_id) to the request headers
- The Score Service should cache the key for a short window (e.g., 5 minutes)
- If a duplicate key is detected, return 200 OK without applying the score again

### 4.2. Asynchronous Event Processing

**Observation:** The current design is synchronous (write to DB → respond). Under extreme load (e.g., millions of users), waiting for the database write before responding to the Action Service adds latency.

**Recommendation:**

- Decouple the ingestion from processing using a Message Queue (e.g., RabbitMQ, Kafka, or Redis Streams)
- The `POST /scores` endpoint should push a message to the queue and return 202 Accepted immediately
- A background worker would then consume the message, update the database, and trigger the SSE broadcast

### 4.3. Audit & History Logging

**Observation:** Redis is excellent for "current state" (Top 10), but it is not designed for long-term historical data storage. If cheating investigation or user progression analysis is needed, Redis data is often volatile or expensive to retain long-term.

**Recommendation:**

- Implement "Event Sourcing": every score increment should also be logged to a persistent data store (e.g., PostgreSQL or MongoDB) for auditing purposes
- This allows for replaying scores or reverting malicious actions if necessary

### 4.4. SSE Reconnection Strategy

**Observation:** SSE relies on a persistent HTTP connection. If the user's mobile device switches from Wi-Fi to 4G, the connection will drop, and they might miss a score update.

**Recommendation:**

- Implement the SSE Last-Event-ID header logic
- When a client reconnects, it should send the ID of the last event it received
- The server should re-send the latest leaderboard snapshot if the client is out of sync

### 4.5. Leaderboard Time-to-Live (TTL)

**Observation:** Leaderboards are rarely "forever." Usually, they reset weekly, daily, or per match.

**Recommendation:**

- Utilize Redis' TTL (Time To Live) features to automatically expire keys
- Alternatively, structure leaderboard keys to include a timeframe, e.g., `leaderboard:daily:2023-10-27`

---

## 5. Conclusion

This specification provides a secure, scalable foundation for a real-time leaderboard service. By leveraging a Backend-to-Backend architecture for data ingestion and Server-Sent Events for client updates, we ensure a secure environment with minimal latency for the end-user.