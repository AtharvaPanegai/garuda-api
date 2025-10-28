# Garuda API Monitoring System - Architecture & HLD Diagrams (ASCII Format)

## 1. SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATION LAYER                             │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  User Application with api-radar NPM Package                         │   │
│  │  - Express.js Middleware                                             │   │
│  │  - Auto-captures: method, path, status, responseTime                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │
                                        │ API Requests + Metrics
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GATEWAY LAYER (NGINX)                              │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  NGINX Gateway / Load Balancer                                       │   │
│  │  - Routes traffic to Garuda-Caching                                  │   │
│  │  - Load balancing                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │
                                        │ Route Traffic
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CACHING & MESSAGE QUEUE LAYER                            │
│                                                                               │
│  ┌──────────────────────────┐         ┌──────────────────────────────────┐ │
│  │  Garuda-Caching Service  │◄───────►│  Redis Cache                     │ │
│  │  - Port: 5095            │         │  - Monitoring Status             │ │
│  │  - Node.js + Express     │         │  - API Configurations            │ │
│  │  - Route Decision Logic  │         │  - Fast Lookups                  │ │
│  └───────────┬──────────────┘         └──────────────────────────────────┘ │
│              │                                                               │
│              │                                                               │
│              ├─────────► [Critical/New API] ──────────────────┐             │
│              │                                                 │             │
│              │                                                 │             │
│              └─────────► [Normal Traffic] ──────┐             │             │
│                                                  │             │             │
│  ┌───────────────────────────────────────────┐  │             │             │
│  │  RabbitMQ Message Queue                   │◄─┘             │             │
│  │  - Queue: garuda.monitorapi               │                │             │
│  │  - Async message buffering                │                │             │
│  └───────────────────┬───────────────────────┘                │             │
└────────────────────────┼──────────────────────────────────────┼─────────────┘
                         │                                       │
                         │ Consume Messages                      │ Direct Route
                         ▼                                       │
┌─────────────────────────────────────────────────────────────┐ │
│              BATCH PROCESSING LAYER                          │ │
│                                                               │ │
│  ┌──────────────────────────────────────────────────────┐   │ │
│  │  Batch Consumer Service                              │   │ │
│  │  - Aggregates in-memory                              │   │ │
│  │  - Max Batch Size: 500 messages                      │   │ │
│  │  - Flush Interval: 60 seconds                        │   │ │
│  │                                                       │   │ │
│  │  ┌─────────────────────────────────────┐            │   │ │
│  │  │  In-Memory Batch Storage            │            │   │ │
│  │  │  {                                  │            │   │ │
│  │  │    "projectId_apiPath": {          │            │   │ │
│  │  │      hits: count,                   │            │   │ │
│  │  │      apiLogs: [...]                │            │   │ │
│  │  │    }                                │            │   │ │
│  │  │  }                                  │            │   │ │
│  │  └─────────────────────────────────────┘            │   │ │
│  └───────────────────────┬──────────────────────────────┘   │ │
└──────────────────────────┼──────────────────────────────────┘ │
                           │ POST /radar/bulkupdate             │
                           └────────────────┬───────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CORE SERVICES LAYER                                  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Garuda-API Service (Port: 5094)                                     │   │
│  │                                                                       │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │   │
│  │  │ User Controller  │  │ Project          │  │ Radar Controller │  │   │
│  │  │ - Signup/Signin  │  │ Controller       │  │ - Process Hits   │  │   │
│  │  │ - Authentication │  │ - CRUD Ops       │  │ - Bulk Updates   │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │   │
│  │                                                                       │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │                     Services Layer                             │ │   │
│  │  │  - Email Service (Nodemailer + Brevo SMTP)                     │ │   │
│  │  │  - Redis Service (Cache Operations)                            │ │   │
│  │  │  - Kafka Service (Stream Processing)                           │ │   │
│  │  │  - RabbitMQ Service (Message Publishing)                       │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────┬───────────────────────────────────┘ │
└────────────────────────────────────────┼─────────────────────────────────────┘
                                         │
                                         │ Read/Write Operations
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA PERSISTENCE LAYER                             │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      MongoDB Database                                │   │
│  │                                                                       │   │
│  │  Collections:                                                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │  Users       │  │  Projects    │  │  APIs        │             │   │
│  │  │  - Auth Data │  │  - API Keys  │  │  - Endpoints │             │   │
│  │  │  - Profile   │  │  - On-call   │  │  - Status    │             │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │   │
│  │                                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐                                │   │
│  │  │  Radar       │  │  Incidents   │                                │   │
│  │  │  - Metrics   │  │  - Failures  │                                │   │
│  │  │  - Response  │  │  - Alerts    │                                │   │
│  │  └──────────────┘  └──────────────┘                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │
                                        │ On API Failure (5xx)
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NOTIFICATION SERVICES                                 │
│                                                                               │
│  ┌──────────────────────────────┐      ┌──────────────────────────────┐    │
│  │  Email Alert Service         │      │  SMS Service (Optional)      │    │
│  │  - Nodemailer                │      │  - Twilio Integration        │    │
│  │  - Brevo SMTP Relay          │      │  - SMS Notifications         │    │
│  │  - Alert on-call person      │      │                              │    │
│  └──────────────────────────────┘      └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND LAYER                                    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Garuda-UI Dashboard                                                 │   │
│  │  - React 18 + Redux                                                  │   │
│  │  - Tailwind CSS                                                      │   │
│  │  - Recharts for Analytics                                            │   │
│  │  - Real-time Monitoring                                              │   │
│  │  - Project Management                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. HIGH-LEVEL DESIGN (HLD) - REQUEST FLOW

```
┌──────────────┐
│ Client App   │  Step 1: User makes API request
│ (api-radar)  │          AddRadar middleware captures metrics
└──────┬───────┘          (method, path, status, responseTime)
       │
       │ POST with metrics
       ▼
┌──────────────┐
│    NGINX     │  Step 2: Gateway routes to Caching Service
│   Gateway    │
└──────┬───────┘
       │
       │ Route to /api/v1/cache/monitorapi
       ▼
┌──────────────────┐
│ Garuda-Caching   │  Step 3: Check Redis for monitoring status
└────────┬─────────┘
         │
         │ GET monitoring status
         ▼
     ┌──────┐
     │Redis │  Step 4: Return status (enabled/disabled)
     └───┬──┘
         │
         │ Status returned
         ▼
    ┌─────────────────────────────────────┐
    │  DECISION: Is API Critical or New?  │
    └─────────┬──────────────┬────────────┘
              │              │
     YES (5xx │              │ NO (2xx/3xx/4xx)
     or New)  │              │
              ▼              ▼
    ┌──────────────┐   ┌──────────────┐
    │ DIRECT ROUTE │   │ QUEUE ROUTE  │  Step 5: Route decision
    └──────┬───────┘   └──────┬───────┘
           │                  │
           │                  │ Publish message
           │                  ▼
           │            ┌──────────────┐
           │            │  RabbitMQ    │  Step 6: Queue for batch processing
           │            │    Queue     │
           │            └──────┬───────┘
           │                   │
           │                   │ Consume
           │                   ▼
           │            ┌──────────────────┐
           │            │ Batch Consumer   │  Step 7: Aggregate messages
           │            │                  │          in memory
           │            │ Count: N/500     │
           │            │ Timer: T/60s     │
           │            └──────┬───────────┘
           │                   │
           │                   │ When N≥500 OR T≥60s
           │                   │
           │                   │ POST /radar/bulkupdate
           │                   │
           └───────────────────┴─────────────────┐
                                                  ▼
                                          ┌──────────────┐
                                          │ Garuda-API   │  Step 8: Process request
                                          │   Service    │
                                          └──────┬───────┘
                                                 │
                                                 │ Validate API Key & Project
                                                 ▼
                                          ┌──────────────┐
                                          │ Create/Update│  Step 9: Update API model
                                          │  API Model   │
                                          └──────┬───────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │ Update Radar │  Step 10: Update metrics
                                          │   Metrics    │
                                          └──────┬───────┘
                                                 │
                                                 │
                                      ┌──────────▼──────────┐
                                      │ Is API Down (5xx)?  │  Step 11: Check for incidents
                                      └──────┬──────┬───────┘
                                          YES│      │NO
                                             │      │
                                             ▼      ▼
                                    ┌──────────┐  ┌────────┐
                                    │ Create   │  │  Save  │
                                    │ Incident │  │   to   │
                                    └────┬─────┘  │MongoDB │
                                         │        └────────┘
                                         │ Check recent
                                         │ (within 15 min)
                                         ▼
                                    ┌──────────┐
                                    │   Send   │  Step 12: Alert on-call person
                                    │  Email   │
                                    │  Alert   │
                                    └────┬─────┘
                                         │
                                         ▼
                                    ┌──────────┐
                                    │   Save   │  Step 13: Persist to database
                                    │    to    │
                                    │ MongoDB  │
                                    └────┬─────┘
                                         │
                                         ▼
                                    ┌──────────┐
                                    │ Response │  Step 14: Complete
                                    │ Complete │
                                    └──────────┘


FRONTEND FLOW:
────────────────

┌──────────────┐
│  Garuda UI   │  User views dashboard
└──────┬───────┘
       │
       │ GET /api/v1/project/report
       ▼
┌──────────────┐
│ Garuda-API   │  Query MongoDB
└──────┬───────┘
       │
       │ Query metrics
       ▼
┌──────────────┐
│   MongoDB    │  Return data
└──────┬───────┘
       │
       │ JSON response
       ▼
┌──────────────┐
│  Garuda UI   │  Render charts & analytics
└──────────────┘
```

## 3. BATCH PROCESSING FLOW DIAGRAM

```
                    ┌─────────────────────────────────────┐
                    │  RabbitMQ Queue: garuda.monitorapi  │
                    └──────────────┬──────────────────────┘
                                   │
                                   │ Consume Messages
                                   ▼
                    ┌──────────────────────────────────────┐
                    │     BATCH CONSUMER SERVICE           │
                    │                                      │
                    │  Configuration:                      │
                    │  - MAX_BATCH_SIZE: 500              │
                    │  - BATCH_INTERVAL: 60 seconds       │
                    │  - Storage: In-memory Map           │
                    └──────────────┬───────────────────────┘
                                   │
                                   │ Add to batchStorage
                                   ▼
     ┌───────────────────────────────────────────────────────────────┐
     │              IN-MEMORY BATCH STORAGE                          │
     │                                                                │
     │  Data Structure:                                              │
     │  {                                                            │
     │    "projectId_/api/path": {                                   │
     │      hits: 45,                                                │
     │      apiLogs: [                                               │
     │        { projectId, path, method, status, responseTime },     │
     │        { projectId, path, method, status, responseTime },     │
     │        ...                                                    │
     │      ]                                                        │
     │    },                                                         │
     │    "projectId_/api/another": {                                │
     │      hits: 127,                                               │
     │      apiLogs: [...]                                           │
     │    }                                                          │
     │  }                                                            │
     │                                                                │
     │  Current Batch Count: N / 500                                │
     │  Time Elapsed: T / 60s                                       │
     └────────────────────────┬──────────────────────────────────────┘
                              │
                              │
              ┌───────────────▼─────────────────┐
              │  CHECK TRIGGER CONDITIONS       │
              │                                  │
              │  Condition 1: Count >= 500      │
              │       OR                         │
              │  Condition 2: Time >= 60 seconds │
              └───────────┬────────────┬─────────┘
                          │            │
                    NO    │            │  YES
                          │            │
                          ▼            ▼
                  ┌─────────────┐  ┌────────────────────┐
                  │ WAIT FOR    │  │ PREPARE PAYLOAD    │
                  │ MORE        │  │                    │
                  │ MESSAGES    │  │ Create bulk update │
                  │             │  │ request body       │
                  └─────────────┘  └────────┬───────────┘
                          ▲                 │
                          │                 │ POST /api/v1/radar/bulkupdate
                          │                 ▼
                          │          ┌───────────────────┐
                          │          │  SEND TO          │
                          │          │  GARUDA-API       │
                          │          │                   │
                          │          │  Endpoint:        │
                          │          │  /radar/bulkupdate│
                          │          └────────┬──────────┘
                          │                   │
                          │                   │
                          │        ┌──────────▼──────────┐
                          │        │   HTTP RESPONSE     │
                          │        └──────┬──────┬───────┘
                          │               │      │
                          │         200   │      │  5xx
                          │               │      │
                          │               ▼      ▼
                          │        ┌──────────┐ ┌─────────┐
                          │        │ SUCCESS  │ │  RETRY  │
                          │        └────┬─────┘ └────┬────┘
                          │             │            │
                          │             │            └──────┐
                          │             ▼                   │
                          │      ┌─────────────────┐        │
                          │      │ CLEAR STORAGE   │        │
                          │      │                 │        │
                          │      │ - Reset counter │        │
                          │      │ - Clear map     │        │
                          │      │ - Ready for new │        │
                          │      └────────┬────────┘        │
                          │               │                 │
                          └───────────────┴─────────────────┘

BATCH AGGREGATION EXAMPLE:
──────────────────────────

Time 0s:    Message 1 arrives → batchStorage["proj1_/api/users"] = { hits: 1, logs: [...] }
Time 5s:    Message 2 arrives → batchStorage["proj1_/api/users"] = { hits: 2, logs: [...] }
Time 10s:   Message 3 arrives → batchStorage["proj1_/api/orders"] = { hits: 1, logs: [...] }
...
Time 58s:   Total 487 messages in storage
Time 60s:   ⏰ TIMER TRIGGER! → Send bulk update with 487 aggregated hits
Time 60s:   Storage cleared, ready for next batch

OR

Messages 1-499:   Accumulating in memory
Message 500:      🎯 SIZE TRIGGER! → Send bulk update immediately
                  Storage cleared, timer reset

BENEFITS:
─────────
✓ Reduces DB writes by 95%+
✓ Improves throughput
✓ Lower database load
✓ Efficient aggregation
✓ No data loss (RabbitMQ durability)
```

## 4. DATA FLOW DECISION TREE

```
                         ┌─────────────────────┐
                         │   API Request       │
                         │   Initiated         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   api-radar         │
                         │   Middleware        │
                         │   Collect Metrics   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   NGINX Gateway     │
                         │   Route Traffic     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Garuda-Caching      │
                         │ Service             │
                         └──────────┬──────────┘
                                    │
                                    │ Check Redis
                                    ▼
                         ┌─────────────────────┐
                         │ Redis Cache Lookup  │
                         │ Monitoring Status?  │
                         └──────────┬──────────┘
                                    │
                                    │
                         ┌──────────▼──────────┐
                         │  Status Found?      │
                         └──────┬──────┬───────┘
                              NO│      │YES
                                │      │
                                ▼      ▼
                         ┌──────────┐ ┌──────────────────────────┐
                         │  Route   │ │  Check API Condition     │
                         │  Direct  │ │                          │
                         │  to API  │ │  Is it:                  │
                         └────┬─────┘ │  1. 5xx Status?         │
                              │       │  2. New API?            │
                              │       │  3. Critical Priority?  │
                              │       └────────┬─────────┬───────┘
                              │              YES│        │NO
                              │                 │        │
                              └─────────────────┤        │
                                                │        │
                                    ┌───────────▼────┐   │
                                    │  DIRECT ROUTE  │   │
                                    │  ============  │   │
                                    │  Bypass Queue  │   │
                                    │  Immediate     │   │
                                    │  Processing    │   │
                                    └───────┬────────┘   │
                                            │            │
                                            │            │
                                            │            │
                                            │   ┌────────▼────────┐
                                            │   │  QUEUE ROUTE    │
                                            │   │  ===========    │
                                            │   │  Publish to     │
                                            │   │  RabbitMQ       │
                                            │   │  Batch Later    │
                                            │   └────────┬────────┘
                                            │            │
                                            │            │ To Queue
                                            │            ▼
                                            │   ┌─────────────────┐
                                            │   │   RabbitMQ      │
                                            │   │   Queue         │
                                            │   └────────┬────────┘
                                            │            │
                                            │            │ Batch Processing
                                            │            ▼
                                            │   ┌─────────────────┐
                                            │   │ Batch Consumer  │
                                            │   │ Aggregate 60s   │
                                            │   │ or 500 msgs     │
                                            │   └────────┬────────┘
                                            │            │
                                            └────────────┤
                                                         │
                                        ┌────────────────▼─────────────┐
                                        │      GARUDA-API SERVICE      │
                                        │                              │
                                        │  1. Validate API Key         │
                                        │  2. Validate Project ID      │
                                        └────────────────┬─────────────┘
                                                         │
                                        ┌────────────────▼─────────────┐
                                        │   CREATE/UPDATE API MODEL    │
                                        └────────────────┬─────────────┘
                                                         │
                                        ┌────────────────▼─────────────┐
                                        │   UPDATE RADAR METRICS       │
                                        │                              │
                                        │   - Hits per timeframe       │
                                        │   - Status codes             │
                                        │   - Response times           │
                                        │   - Average calculations     │
                                        └────────────────┬─────────────┘
                                                         │
                                        ┌────────────────▼─────────────┐
                                        │   CHECK API HEALTH           │
                                        │   Is status 5xx?             │
                                        └────────┬──────────┬──────────┘
                                              YES│          │NO
                                                 │          │
                                                 ▼          ▼
                                    ┌─────────────────┐  ┌──────────────┐
                                    │ INCIDENT FLOW   │  │  SAVE TO DB  │
                                    │                 │  │              │
                                    │ 1. Check recent │  │  Update:     │
                                    │    (15 min)     │  │  - API model │
                                    │ 2. Create/Update│  │  - Radar     │
                                    │    Incident     │  │  Complete    │
                                    │ 3. Set API Down │  └──────────────┘
                                    │ 4. Fetch On-call│
                                    │ 5. Send Alert   │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  EMAIL SERVICE  │
                                    │                 │
                                    │  Nodemailer +   │
                                    │  Brevo SMTP     │
                                    │                 │
                                    │  Alert sent to  │
                                    │  on-call person │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  SAVE INCIDENT  │
                                    │  TO MONGODB     │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   COMPLETE      │
                                    └─────────────────┘
```

## 5. COMPONENT INTERACTION DIAGRAM

```
┌────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER                                │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │  Garuda-UI Dashboard (React + Redux + Tailwind)              │    │
│   │  - User Authentication Pages                                  │    │
│   │  - Project Management Interface                               │    │
│   │  - API Monitoring Dashboard                                   │    │
│   │  - Analytics & Reports (Recharts)                            │    │
│   │  - Incident Tracking                                          │    │
│   └────────────────────────┬─────────────────────────────────────┘    │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
                             │ REST API Calls (axios)
                             │ - GET /api/v1/project/report
                             │ - POST /api/v1/signin
                             │ - POST /api/v1/radar/singlereport
                             │
┌────────────────────────────▼──────────────────────────────────────────┐
│                         API GATEWAY LAYER                              │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │  Authentication Middleware (JWT)                              │    │
│   │  - isLoggedIn                                                 │    │
│   │  - Token Verification                                         │    │
│   │  - Cookie Validation                                          │    │
│   └────────────────────────┬─────────────────────────────────────┘    │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
                             │ Route to Controllers
                             │
┌────────────────────────────▼──────────────────────────────────────────┐
│                      CONTROLLER LAYER                                  │
│                                                                          │
│   ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐ │
│   │ User Controller │  │ Project          │  │ Radar Controller    │ │
│   │ ───────────────│  │ Controller       │  │ ─────────────────── │ │
│   │ - signup()      │  │ ────────────────│  │ - monitorApi()      │ │
│   │ - signin()      │  │ - createProject()│  │ - singleReport()    │ │
│   │ - signout()     │  │ - createApiKey() │  │ - bulkUpdate()      │ │
│   │ - getUser()     │  │ - addOnCall()    │  │ - configRadar()     │ │
│   │ - updateUser()  │  │ - getApis()      │  │                     │ │
│   │ - deleteUser()  │  │ - getReport()    │  │                     │ │
│   └────────┬────────┘  └────────┬─────────┘  └──────────┬──────────┘ │
└────────────┼─────────────────────┼────────────────────────┼───────────┘
             │                     │                        │
             │                     │                        │
             │                     │                        │
┌────────────▼─────────────────────▼────────────────────────▼───────────┐
│                         SERVICE LAYER                                  │
│                                                                          │
│   ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐│
│   │ Email Service    │  │ Redis Service    │  │ RabbitMQ Service    ││
│   │ ────────────────│  │ ────────────────│  │ ───────────────────││
│   │ - sendAlert()    │  │ - get()          │  │ - publishMessage()  ││
│   │ - templates      │  │ - set()          │  │ - consumeMessages() ││
│   │                  │  │ - delete()       │  │ - createChannel()   ││
│   └──────────────────┘  └──────────────────┘  └─────────────────────┘│
│                                                                          │
│   ┌──────────────────┐  ┌──────────────────┐                          │
│   │ Kafka Service    │  │ Bulk Update Svc  │                          │
│   │ ────────────────│  │ ────────────────│                          │
│   │ - produce()      │  │ - batchConsumer()│                          │
│   │ - consume()      │  │ - aggregate()    │                          │
│   └──────────────────┘  └──────────────────┘                          │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │
                                 │ Database Operations
                                 │
┌────────────────────────────────▼──────────────────────────────────────┐
│                    DATA ACCESS LAYER (Models)                          │
│                                                                          │
│   ┌───────────┐  ┌──────────┐  ┌────────┐  ┌────────┐  ┌──────────┐ │
│   │   User    │  │ Project  │  │  API   │  │ Radar  │  │ Incident │ │
│   │   Model   │  │  Model   │  │  Model │  │ Model  │  │  Model   │ │
│   │ ───────── │  │ ──────── │  │ ────── │  │ ────── │  │ ──────── │ │
│   │ Schema:   │  │ Schema:  │  │Schema: │  │Schema: │  │ Schema:  │ │
│   │           │  │          │  │        │  │        │  │          │ │
│   │ username  │  │ name     │  │endpoint│  │ apiId  │  │ apiId    │ │
│   │ email     │  │ customer │  │ method │  │ hits   │  │ time     │ │
│   │ password  │  │ apiKey   │  │ project│  │ status │  │ logs     │ │
│   │ phone     │  │ onCall   │  │ status │  │ avgRes │  │ count    │ │
│   │ projects[]│  │ totalApi │  │ radar  │  │ metrics│  │          │ │
│   └─────┬─────┘  └────┬─────┘  └───┬────┘  └───┬────┘  └────┬─────┘ │
└─────────┼─────────────┼────────────┼───────────┼─────────────┼───────┘
          │             │            │           │             │
          │             │            │           │             │
          └─────────────┴────────────┴───────────┴─────────────┘
                                     │
                                     │ CRUD Operations
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                                   │
│                                                                           │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │                      MongoDB                                   │    │
│   │                                                                 │    │
│   │  Collections:                                                  │    │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │    │
│   │  │  users   │ │ projects │ │   apis   │ │  radars  │        │    │
│   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │    │
│   │                                                                 │    │
│   │  ┌──────────┐                                                 │    │
│   │  │incidents │                                                 │    │
│   │  └──────────┘                                                 │    │
│   │                                                                 │    │
│   │  Indexes: username, email, apiKey, apiEndPoint                │    │
│   └───────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘

DATA FLOW:
──────────

Frontend Request → Auth Middleware → Controller → Service Layer → Model → Database
                                                      ↓
                                            External Services
                                            (Email, Redis, RabbitMQ)
```

## 6. DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DOCKER CONTAINERS                                 │
│                                                                           │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  Container 1: Garuda-API                                         │  │
│   │  ══════════════════════════════════════════════════════════════  │  │
│   │                                                                   │  │
│   │  Image: node:18-slim                                             │  │
│   │  Port: 5094 (exposed)                                            │  │
│   │  Working Dir: /app                                               │  │
│   │                                                                   │  │
│   │  Environment Variables:                                          │  │
│   │  - DB_CONNECTION_STRING (MongoDB URI)                            │  │
│   │  - JWT_SECRET                                                    │  │
│   │  - REDIS_HOST, REDIS_PORT                                        │  │
│   │  - RABBITMQ_URL                                                  │  │
│   │  - EMAIL_AUTH_TOKEN                                              │  │
│   │                                                                   │  │
│   │  Command: node index.js                                          │  │
│   └───────────────────────────┬───────────────────────────────────────┘ │
│                               │                                         │
│   ┌───────────────────────────▼───────────────────────────────────────┐ │
│   │  Container 2: Garuda-Caching                                      │ │
│   │  ═══════════════════════════════════════════════════════════════  │ │
│   │                                                                   │ │
│   │  Image: node:18-slim                                             │ │
│   │  Port: 5095 (exposed)                                            │ │
│   │  Working Dir: /app                                               │ │
│   │                                                                   │ │
│   │  Environment Variables:                                          │ │
│   │  - DB_CONNECTION_STRING                                          │ │
│   │  - REDIS_HOST, REDIS_PORT                                        │ │
│   │  - RABBITMQ_URL                                                  │ │
│   │  - GARUDA_API (http://garuda-api:5094)                           │ │
│   │                                                                   │ │
│   │  Command: node index.js                                          │ │
│   └───────────────────────────┬───────────────────────────────────────┘ │
│                               │                                         │
│   ┌───────────────────────────▼───────────────────────────────────────┐ │
│   │  Container 3: Garuda-UI                                           │ │
│   │  ═══════════════════════════════════════════════════════════════  │ │
│   │                                                                   │ │
│   │  Image: node:18 (with nginx for serving)                         │ │
│   │  Port: 3000 (development) / 80 (production)                      │ │
│   │  Build Tool: Vite                                                │ │
│   │                                                                   │ │
│   │  Environment Variables:                                          │ │
│   │  - VITE_API_URL (http://garuda-api:5094)                         │ │
│   │                                                                   │ │
│   │  Command: npm run dev / npm run build + serve                    │ │
│   └───────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                │ Network: Bridge / Host
                                │
┌───────────────────────────────▼─────────────────────────────────────────┐
│                    EXTERNAL / MANAGED SERVICES                           │
│                                                                           │
│   ┌──────────────────────┐  ┌──────────────────────┐                   │
│   │  MongoDB Atlas       │  │  Redis Cloud         │                   │
│   │  ══════════════════  │  │  ══════════════════  │                   │
│   │                      │  │                      │                   │
│   │  Collections:        │  │  Data:               │                   │
│   │  - users             │  │  - API monitoring    │                   │
│   │  - projects          │  │    status            │                   │
│   │  - apis              │  │  - Cache configs     │                   │
│   │  - radars            │  │                      │                   │
│   │  - incidents         │  │  TTL: Configurable   │                   │
│   │                      │  │  Persistence: Yes    │                   │
│   │  Replica Set: Yes    │  │                      │                   │
│   │  Backup: Automated   │  │                      │                   │
│   └──────────────────────┘  └──────────────────────┘                   │
│                                                                           │
│   ┌──────────────────────┐  ┌──────────────────────┐                   │
│   │  RabbitMQ            │  │  Brevo SMTP          │                   │
│   │  ══════════════════  │  │  ══════════════════  │                   │
│   │                      │  │                      │                   │
│   │  Queue:              │  │  Service:            │                   │
│   │  - garuda.monitorapi │  │  - Email alerts      │                   │
│   │                      │  │  - From:             │                   │
│   │  Durable: Yes        │  │    alerts@garuda.com │                   │
│   │  Auto-ACK: No        │  │                      │                   │
│   │  Prefetch: 1         │  │  Templates:          │                   │
│   │                      │  │  - HTML alerts       │                   │
│   │  Management UI:      │  │  - Support emails    │                   │
│   │  Port 15672          │  │                      │                   │
│   └──────────────────────┘  └──────────────────────┘                   │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                     MONITORING & OBSERVABILITY                            │
│                                                                             │
│   ┌──────────────────────┐  ┌──────────────────────┐                     │
│   │  Application Logs    │  │  Performance Metrics │                     │
│   │  ══════════════════  │  │  ══════════════════  │                     │
│   │                      │  │                      │                     │
│   │  Package: logat      │  │  Source: Radar Data  │                     │
│   │                      │  │                      │                     │
│   │  Logs:               │  │  Metrics:            │                     │
│   │  - API hits          │  │  - Response times    │                     │
│   │  - Errors            │  │  - Status codes      │                     │
│   │  - System events     │  │  - Hit counts        │                     │
│   │  - Batch processing  │  │  - Incident rates    │                     │
│   └──────────────────────┘  └──────────────────────┘                     │
└───────────────────────────────────────────────────────────────────────────┘

CONTAINER NETWORKING:
─────────────────────

garuda-api:5094      ←──── HTTP calls from garuda-caching
       ↕
MongoDB Atlas        ←──── Database operations
       ↕
Redis Cloud          ←──── Cache operations
       ↕
RabbitMQ             ←──── Message queue
       ↕
Brevo SMTP           ←──── Email alerts


garuda-caching:5095  ←──── HTTP calls from NGINX / api-radar
       ↕
Redis Cloud          ←──── Fast lookups
       ↕
RabbitMQ             ←──── Publish messages


garuda-ui:3000       ←──── Browser requests
       ↕
garuda-api:5094      ←──── REST API calls
```

## 7. ALERT & INCIDENT MANAGEMENT FLOW

```
                    ┌──────────────────────────┐
                    │   API Hit Received       │
                    │   at Garuda-API          │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │  Extract Status Code     │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  Check Status Code       │
                    │                          │
                    │  2xx? 3xx? 4xx? 5xx?     │
                    └────┬───────────────┬─────┘
                         │               │
               2xx/3xx/4xx│               │5xx
            (Normal)      │               │(Error)
                         │               │
                         ▼               ▼
            ┌─────────────────┐  ┌──────────────────────┐
            │  Normal Flow    │  │  ALERT FLOW BEGINS   │
            │  ─────────────  │  │  ════════════════════ │
            │                 │  └──────────┬───────────┘
            │  1. Update      │             │
            │     Radar       │             │
            │     Metrics     │             │ Step 1: Query recent incidents
            │                 │             ▼
            │  2. Save to DB  │  ┌──────────────────────┐
            │                 │  │  Check for Recent    │
            │  3. Done        │  │  Incident            │
            │                 │  │                      │
            └─────────────────┘  │  Query:              │
                                 │  - Same API          │
                                 │  - Within 15 minutes │
                                 └──────────┬───────────┘
                                            │
                                ┌───────────▼───────────┐
                                │   Recent Incident?    │
                                └───┬───────────────┬───┘
                                    │               │
                              NO    │               │  YES
                         (New Issue)│               │  (Ongoing Issue)
                                    │               │
                                    ▼               ▼
                    ┌───────────────────────┐  ┌────────────────────────┐
                    │  CREATE NEW INCIDENT  │  │  UPDATE EXISTING       │
                    │  ══════════════════   │  │  INCIDENT              │
                    │                       │  │  ════════════════════  │
                    │  incident = {         │  │                        │
                    │    project: ObjectId  │  │  Push to:              │
                    │    apiId: ObjectId    │  │  stepsAfterFailure[]   │
                    │    time: timestamp    │  │                        │
                    │    firstFailedLog: {  │  │  Increment:            │
                    │      status,          │  │  totalFailedApiCalls   │
                    │      responseTime,    │  │                        │
                    │      ...              │  │  Log details:          │
                    │    },                 │  │  - Status code         │
                    │    totalFailed: 1     │  │  - Response time       │
                    │  }                    │  │  - Timestamp           │
                    └───────────┬───────────┘  └────────────┬───────────┘
                                │                           │
                                └───────────┬───────────────┘
                                            │
                                            ▼
                                ┌────────────────────────┐
                                │  SET API STATUS        │
                                │  isCurrentlyDown=true  │
                                └────────────┬───────────┘
                                             │
                                             ▼
                                ┌────────────────────────┐
                                │  FETCH PROJECT DETAILS │
                                │                        │
                                │  Get:                  │
                                │  - On-call person name │
                                │  - On-call email       │
                                │  - On-call phone       │
                                │  - Project name        │
                                └────────────┬───────────┘
                                             │
                                ┌────────────▼───────────┐
                                │  On-call person        │
                                │  configured?           │
                                └────┬──────────────┬────┘
                                   YES│              │NO
                                      │              │
                                      ▼              ▼
                        ┌──────────────────────┐  ┌─────────────────┐
                        │  PREPARE EMAIL       │  │  LOG WARNING    │
                        │  ════════════════    │  │  No on-call     │
                        │                      │  │  configured     │
                        │  Parse template:     │  │                 │
                        │  alert.email.template│  │  Skip alert     │
                        │                      │  └─────────────────┘
                        │  Variables:          │
                        │  - API endpoint      │
                        │  - Status code       │
                        │  - Response time     │
                        │  - Incident time     │
                        │  - Project name      │
                        │  - Failed count      │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  SEND EMAIL via      │
                        │  Nodemailer          │
                        │                      │
                        │  SMTP: Brevo         │
                        │  From: alerts@...    │
                        │  To: on-call email   │
                        │  Subject: API Alert  │
                        │  Body: HTML template │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  Email Send Result   │
                        └──────┬──────────┬────┘
                             SUCCESS│      │FAILURE
                                    │      │
                                    ▼      ▼
                        ┌─────────────┐  ┌──────────────┐
                        │  LOG        │  │  LOG ERROR   │
                        │  SUCCESS    │  │  Retry logic │
                        │             │  │  (optional)  │
                        └──────┬──────┘  └──────┬───────┘
                               │                │
                               └────────┬───────┘
                                        │
                                        ▼
                            ┌────────────────────────┐
                            │  SAVE INCIDENT TO DB   │
                            │                        │
                            │  MongoDB.incidents     │
                            │  .save()               │
                            └────────────┬───────────┘
                                         │
                                         ▼
                            ┌────────────────────────┐
                            │  UPDATE API MODEL      │
                            │  isCurrentlyDown=true  │
                            └────────────┬───────────┘
                                         │
                                         ▼
                            ┌────────────────────────┐
                            │  CONTINUE MONITORING   │
                            │                        │
                            │  Wait for next API hit │
                            └────────────────────────┘

EMAIL ALERT TEMPLATE:
─────────────────────
┌─────────────────────────────────────────────────────────┐
│  Subject: 🚨 API Alert - [API_ENDPOINT] is Down          │
│                                                           │
│  Dear [ON_CALL_NAME],                                    │
│                                                           │
│  An API in your project has experienced an error:        │
│                                                           │
│  Project: [PROJECT_NAME]                                 │
│  API Endpoint: [API_METHOD] [API_PATH]                   │
│  Status Code: [STATUS_CODE]                              │
│  Response Time: [RESPONSE_TIME]ms                        │
│  Incident Time: [TIMESTAMP]                              │
│  Failed Calls: [COUNT]                                   │
│                                                           │
│  Please investigate immediately.                          │
│                                                           │
│  Best regards,                                            │
│  Garuda Monitoring System                                │
└─────────────────────────────────────────────────────────┘

INCIDENT TRACKING:
──────────────────

Incident Document:
{
  _id: ObjectId,
  project: ObjectId("..."),
  apiId: ObjectId("..."),
  timeOfIncident: "2024-01-15T10:30:00Z",
  firstFailedApiLog: {
    method: "GET",
    path: "/api/users",
    statusCode: 503,
    responseTime: 5000
  },
  stepsAfterFailure: [
    { status: 503, time: "10:31:00Z" },
    { status: 502, time: "10:32:00Z" },
    ...
  ],
  totalFailedApiCalls: 15,
  createdAt: Date
}

15-MINUTE WINDOW LOGIC:
───────────────────────
Current Time: 10:35:00
Query: incidents.find({
  apiId: [API_ID],
  createdAt: { $gte: 10:20:00 }  // 15 min ago
})

If found → Update existing
If not found → Create new incident
```

## 8. PERFORMANCE METRICS CALCULATION

```
┌─────────────────────────────────────────────────────────────────────┐
│                 RADAR PERFORMANCE METRICS                            │
│                                                                       │
│  Calculated and stored for each API endpoint:                       │
└─────────────────────────────────────────────────────────────────────┘

1. HITS PER TIMEFRAME
   ═══════════════════

   Data Structure:
   hitsPerTimeFrame: [
     { timeframe: "2024-01-15T10:00:00Z", hits: 145 },
     { timeframe: "2024-01-15T11:00:00Z", hits: 203 },
     { timeframe: "2024-01-15T12:00:00Z", hits: 187 },
     ...
   ]

   Calculation:
   - Group API hits by hour/day/week
   - Increment counter for each timeframe
   - Used for trend analysis


2. STATUS CODES PER TIMEFRAME
   ════════════════════════════

   Data Structure:
   statusCodesPerTimeFrame: [
     {
       timeframe: "2024-01-15T10:00:00Z",
       statusCodes: [
         { statusCode: 200, count: 140 },
         { statusCode: 404, count: 3 },
         { statusCode: 500, count: 2 }
       ]
     },
     ...
   ]

   Calculation:
   - Track frequency of each status code
   - Group by timeframe
   - Used for error rate analysis


3. AVERAGE RESPONSE TIME
   ══════════════════════

   Formula:
   avgResponseTime = (Σ all response times) / (total hits)

   Example:
   Request 1: 120ms
   Request 2: 150ms
   Request 3: 130ms
   Average = (120 + 150 + 130) / 3 = 133.33ms

   Stored as: "133.33"


4. MOST CAPTURED STATUS CODE
   ═══════════════════════════

   Algorithm:
   statusCodeMap = {}
   for each log:
     statusCodeMap[log.status] = (statusCodeMap[log.status] || 0) + 1

   mostCaptured = max(statusCodeMap by value)

   Example:
   200: 500 times
   404: 10 times
   500: 5 times
   → Most captured: "200"


5. MOST RECENT STATUS CODE & RESPONSE TIME
   ════════════════════════════════════════

   Simply store the latest values from the most recent API hit:

   apiMostRecentStatusCode: "200"
   apiMostRecentResponseTime: "145"


6. TOTAL HITS TILL NOW
   ════════════════════

   Simple counter incremented on each API hit:

   totalHitsTillNow: 1523


7. BULK UPDATE AVERAGE CALCULATION
   ═══════════════════════════════

   When batch updates arrive with aggregated data:

   existing = currentRadar.apiAverageResponseTime
   existingHits = currentRadar.totalHitsTillNow
   newHits = bulkData.hits
   newAvg = bulkData.averageResponseTime

   updatedAvg = (
     (existing * existingHits) + (newAvg * newHits)
   ) / (existingHits + newHits)

   Example:
   Existing: 100ms avg over 1000 hits
   New batch: 150ms avg over 500 hits

   Updated = (100 * 1000 + 150 * 500) / (1000 + 500)
           = (100000 + 75000) / 1500
           = 116.67ms


┌─────────────────────────────────────────────────────────────────────┐
│                    METRICS VISUALIZATION                             │
│                                                                       │
│  Used in Garuda-UI Dashboard with Recharts:                         │
│                                                                       │
│  - Line charts: Hits over time                                       │
│  - Bar charts: Status code distribution                              │
│  - Pie charts: Status code breakdown                                 │
│  - Number displays: Average response time, total hits                │
│  - Health indicators: Current API status (up/down)                   │
└─────────────────────────────────────────────────────────────────────┘
```

## System Configuration Summary

### Technology Stack
```
Backend:
- Runtime: Node.js 18
- Framework: Express.js 4.19
- Database: MongoDB (Mongoose 8.4)
- Cache: Redis (ioredis 5.4)
- Queue: RabbitMQ (amqplib 0.10)
- Stream: Kafka (kafkajs 2.2)
- Auth: JWT + bcryptjs
- Email: Nodemailer + Brevo SMTP

Frontend:
- Framework: React 18
- Build: Vite 5.4
- Styling: Tailwind CSS 3.4
- State: Redux 5.0
- Charts: Recharts 2.13
- UI: Radix UI components

Infrastructure:
- Containers: Docker (node:18-slim)
- Gateway: NGINX
- Monitoring: logat package
```

### Key Performance Numbers
```
Batch Processing:
- Max batch size: 500 messages
- Flush interval: 60 seconds
- DB write reduction: ~95%

Caching:
- Redis lookup: <1ms
- Cache hit rate: High for monitoring status

Alert System:
- Incident check window: 15 minutes
- Email delivery: <5 seconds (Brevo SMTP)
- Alert trigger: Immediate on 5xx errors
```

### Ports
```
garuda-api: 5094
garuda-caching: 5095
garuda-ui: 3000 (dev) / 80 (prod)
redis: 6379
rabbitmq: 5672 (AMQP), 15672 (Management UI)
mongodb: 27017
```

### Environment Requirements
```
- Node.js 18+
- MongoDB 4.4+
- Redis 6.0+
- RabbitMQ 3.8+
- Docker (optional)
- SMTP access (Brevo or similar)
```

---

## How to View These Diagrams

These ASCII diagrams work in any text editor or terminal. For the Mermaid diagrams in the original file:

1. **GitHub/GitLab**: Renders automatically
2. **VS Code**: Install "Markdown Preview Mermaid Support" extension
3. **Online**: Copy to https://mermaid.live/
4. **CLI**: Use `mmdc` tool from mermaid-cli package

---

**Generated for: Garuda API Monitoring System**
**Version: 1.0**
**Date: 2025**
