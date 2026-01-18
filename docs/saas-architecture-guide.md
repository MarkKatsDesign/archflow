# Production SaaS Architecture Build Guide

## Architecture Overview

| Attribute        | Detail                                                        |
| ---------------- | ------------------------------------------------------------- |
| **Type**         | Production-grade SaaS (Microservices, Real-time)              |
| **Complexity**   | High                                                          |
| **Use Case**     | B2B Platform (e.g., Slack, Notion, Linear)                    |
| **Key Features** | Multi-tenant, Payments, Async Workflows, Polyglot Persistence |

---

## Phase 1: Create Infrastructure Boundary Zones

> **Start by placing these boundary zones on the canvas to establish the logical structure.**

| Step  | Zone                      | Provider    | Position                       | Purpose                                      |
| ----- | ------------------------- | ----------- | ------------------------------ | -------------------------------------------- |
| **1** | **VPC**                   | AWS         | Center-left (large, main area) | Primary cloud infrastructure boundary        |
| **2** | **Public Subnet**         | AWS         | Inside VPC, top portion        | Internet-facing services                     |
| **3** | **Private Subnet**        | AWS         | Inside VPC, bottom portion     | Internal services, no direct internet access |
| **4** | **Edge Network**          | Cloudflare  | Top-right area                 | CDN and edge services                        |
| **5** | **External Integrations** | Multi-Cloud | Far-right side                 | Third-party SaaS services                    |
| **6** | **Observability**         | Multi-Cloud | Top-right corner               | Monitoring and analytics                     |
| **7** | **Managed Data Services** | Multi-Cloud | Bottom area, outside VPC       | External managed databases                   |

### Zone Layout Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ┌──────────┐                    ┌─────────────────┐   ┌──────────────┐    │
│   │  Vercel  │                    │  Edge Network   │   │ Observability│    │
│   │ (Host)   │                    │  (Cloudflare)   │   │              │    │
│   └──────────┘                    └─────────────────┘   └──────────────┘    │
│         │                                                                   │
│         │    ┌─────────────────────────────────────────────┐                │
│         │    │                 AWS VPC                     │                │
│         │    │  ┌─────────────────────────────────────┐    │                │
│         │    │  │          Public Subnet              │    │   ┌────────┐   │
│         │    │  │   [API Gateway]    [ALB]            │    │   │External│   │
│         └────┼──│                                     │    │   │  Integ │   │
│              │  └─────────────────────────────────────┘    │   │        │   │
│   ┌──────┐   │  ┌─────────────────────────────────────┐    │   │        │   │
│   │Clerk │───┼──│          Private Subnet             │    │   │        │   │
│   │(Auth)│   │  │  [Lambda] [Fargate x2] [SQS]        │    │   │        │   │
│   └──────┘   │  │  [ElastiCache] [Secrets Mgr]        │    │   └────────┘   │
│              │  └─────────────────────────────────────┘    │                │
│              └─────────────────────────────────────────────┘                │
│                                                                             │
│         ┌─────────────────────────────────────────────────────┐             │
│         │            Managed Data Services                    │             │
│         │     [Neon Postgres]  [MongoDB Atlas]                │             │
│         └─────────────────────────────────────────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 2: Place Services Inside Boundary Zones

### Step 2.1: Frontend Host (Outside all zones)

| Step  | Service    | Category | Position                                             |
| ----- | ---------- | -------- | ---------------------------------------------------- |
| **8** | **Vercel** | Hosting  | Top-left, outside all zones (represents client-side) |

### Step 2.2: Edge Network Zone

| Step   | Service            | Category       | Position                            |
| ------ | ------------------ | -------------- | ----------------------------------- |
| **9**  | **Cloudflare CDN** | CDN            | Inside Edge Network zone            |
| **10** | **Cloudflare R2**  | Object Storage | Inside Edge Network zone, below CDN |

### Step 2.3: AWS VPC - Public Subnet

| Step   | Service             | Category      | Position                         |
| ------ | ------------------- | ------------- | -------------------------------- |
| **11** | **AWS API Gateway** | Gateway       | Inside Public Subnet, left side  |
| **12** | **AWS ALB**         | Load Balancer | Inside Public Subnet, right side |

### Step 2.4: AWS VPC - Private Subnet

| Step   | Service                      | Category    | Position                             |
| ------ | ---------------------------- | ----------- | ------------------------------------ |
| **13** | **AWS Lambda**               | Serverless  | Inside Private Subnet, top-left      |
| **14** | **AWS Fargate** (Instance 1) | Container   | Inside Private Subnet, top-center    |
| **15** | **AWS Fargate** (Instance 2) | Container   | Inside Private Subnet, top-right     |
| **16** | **AWS ElastiCache**          | Redis/Cache | Inside Private Subnet, bottom-left   |
| **17** | **AWS SQS**                  | Queue       | Inside Private Subnet, bottom-center |
| **18** | **AWS Secrets Manager**      | Security    | Inside Private Subnet, bottom-right  |

### Step 2.5: Authentication (Outside VPC, needs internet access)

| Step   | Service   | Category | Position                          |
| ------ | --------- | -------- | --------------------------------- |
| **19** | **Clerk** | Auth     | Left side, between Vercel and VPC |

### Step 2.6: Managed Data Services Zone

| Step   | Service           | Category   | Position                        |
| ------ | ----------------- | ---------- | ------------------------------- |
| **20** | **Neon**          | PostgreSQL | Inside Managed Data zone, left  |
| **21** | **MongoDB Atlas** | NoSQL      | Inside Managed Data zone, right |

### Step 2.7: External Integrations Zone

| Step   | Service     | Category       | Position                                   |
| ------ | ----------- | -------------- | ------------------------------------------ |
| **22** | **Stripe**  | Payments       | Inside External Integrations, top          |
| **23** | **Resend**  | Email          | Inside External Integrations, middle       |
| **24** | **Pusher**  | WebSocket      | Inside External Integrations, bottom-left  |
| **25** | **Inngest** | Event/Workflow | Inside External Integrations, bottom-right |

### Step 2.8: Observability Zone

| Step   | Service     | Category       | Position                     |
| ------ | ----------- | -------------- | ---------------------------- |
| **26** | **Sentry**  | Error Tracking | Inside Observability, top    |
| **27** | **PostHog** | Analytics      | Inside Observability, bottom |

---

## Phase 3: Create Connections

### Legend

| Style        | Meaning                        | When to Use                                  |
| ------------ | ------------------------------ | -------------------------------------------- |
| **Solid**    | Synchronous / Request-Response | HTTP calls, queries, direct API calls        |
| **Animated** | Asynchronous / Event-Driven    | Queues, webhooks, background jobs, real-time |

---

### 3.1 Frontend & Edge Connections

| #   | From   | To             | Label            | Style    |
| --- | ------ | -------------- | ---------------- | -------- |
| 1   | Vercel | Cloudflare CDN | Static Assets    | Solid    |
| 2   | Vercel | Clerk          | Auth Token       | Solid    |
| 3   | Vercel | API Gateway    | API Calls        | Solid    |
| 4   | Vercel | Pusher         | WebSocket        | Animated |
| 5   | Vercel | Sentry         | Error Tracking   | Animated |
| 6   | Vercel | PostHog        | Analytics Events | Animated |

### 3.2 API Gateway & Load Balancer

| #   | From        | To          | Label         | Style |
| --- | ----------- | ----------- | ------------- | ----- |
| 7   | API Gateway | Lambda      | Serverless Fn | Solid |
| 8   | API Gateway | ALB         | Microservices | Solid |
| 9   | ALB         | Fargate (1) | HTTP/HTTPS    | Solid |
| 10  | ALB         | Fargate (2) | HTTP/HTTPS    | Solid |

### 3.3 Lambda Connections

| #   | From   | To              | Label          | Style    |
| --- | ------ | --------------- | -------------- | -------- |
| 11  | Lambda | Neon            | SQL Queries    | Solid    |
| 12  | Lambda | ElastiCache     | Cache          | Solid    |
| 13  | Lambda | SQS             | Queue Jobs     | Animated |
| 14  | Lambda | Secrets Manager | Credentials    | Solid    |
| 15  | Lambda | Stripe          | Payments API   | Solid    |
| 16  | Lambda | Sentry          | Error Logs     | Animated |
| 17  | Lambda | PostHog         | Backend Events | Animated |

### 3.4 Fargate (Instance 1) Connections

| #   | From        | To              | Label         | Style    |
| --- | ----------- | --------------- | ------------- | -------- |
| 18  | Fargate (1) | Neon            | SQL Queries   | Solid    |
| 19  | Fargate (1) | MongoDB Atlas   | NoSQL Queries | Solid    |
| 20  | Fargate (1) | ElastiCache     | Cache         | Solid    |
| 21  | Fargate (1) | Secrets Manager | Credentials   | Solid    |
| 22  | Fargate (1) | Cloudflare R2   | Upload Files  | Solid    |
| 23  | Fargate (1) | Stripe          | Subscriptions | Solid    |
| 24  | Fargate (1) | Sentry          | Exceptions    | Animated |

### 3.5 Fargate (Instance 2) Connections

| #   | From        | To              | Label          | Style    |
| --- | ----------- | --------------- | -------------- | -------- |
| 25  | Fargate (2) | MongoDB Atlas   | Document Store | Solid    |
| 26  | Fargate (2) | ElastiCache     | Session Store  | Solid    |
| 27  | Fargate (2) | Secrets Manager | Credentials    | Solid    |
| 28  | Fargate (2) | Cloudflare R2   | Media Storage  | Solid    |
| 29  | Fargate (2) | Sentry          | Exceptions     | Animated |

### 3.6 Authentication Flow

| #   | From  | To   | Label     | Style |
| --- | ----- | ---- | --------- | ----- |
| 30  | Clerk | Neon | User Data | Solid |

### 3.7 Async Processing & Events

| #   | From    | To            | Label            | Style    |
| --- | ------- | ------------- | ---------------- | -------- |
| 31  | SQS     | Inngest       | Workflow Trigger | Animated |
| 32  | Inngest | Resend        | Send Email       | Animated |
| 33  | Inngest | Cloudflare R2 | File Processing  | Animated |

---

## Architecture Review & Recommendations

### What's Strong

1. **Polyglot Persistence** - Using the right database for each use case (Postgres for relational, MongoDB for documents, Redis for caching)
2. **Async Processing** - SQS + Inngest provides reliable background job processing
3. **Edge Caching** - Cloudflare CDN + R2 reduces latency and origin load
4. **Auth Separation** - Clerk handles auth complexity externally
5. **Observability** - Sentry + PostHog covers errors and product analytics

### Architectural Improvements Made

1. **Added VPC Boundary** - All AWS services now sit inside a VPC for network isolation
2. **Public/Private Subnet Split** - Only API Gateway and ALB are internet-facing; compute and data stay private
3. **Grouped Edge Services** - Cloudflare CDN and R2 together in Edge Network zone
4. **External Integrations Zone** - Clear boundary for third-party SaaS dependencies
5. **Managed Data Zone** - Shows that Neon and MongoDB Atlas are external managed services (not self-hosted)

### Security Considerations

| Concern            | Mitigation in Architecture                  |
| ------------------ | ------------------------------------------- |
| Secrets exposure   | AWS Secrets Manager in private subnet       |
| Direct DB access   | Databases accessed only from private subnet |
| DDoS protection    | Cloudflare CDN as edge shield               |
| Auth token leakage | Clerk handles token management externally   |

### Potential Enhancements (Optional)

| Enhancement      | Service       | Purpose                                 |
| ---------------- | ------------- | --------------------------------------- |
| WAF              | AWS WAF       | Web application firewall at API Gateway |
| Service Mesh     | AWS App Mesh  | Inter-service communication security    |
| Secrets Rotation | Vault         | More advanced secrets management        |
| Log Aggregation  | Datadog/Axiom | Centralized logging                     |
| Feature Flags    | LaunchDarkly  | Progressive rollouts                    |

---

## Quick Reference: Service Count

| Category              | Count | Services                                                                                             |
| --------------------- | ----- | ---------------------------------------------------------------------------------------------------- |
| **Boundary Zones**    | 7     | VPC, Public Subnet, Private Subnet, Edge Network, External Integrations, Observability, Managed Data |
| **Compute**           | 4     | Vercel, Lambda, Fargate x2                                                                           |
| **Networking**        | 3     | Cloudflare CDN, API Gateway, ALB                                                                     |
| **Storage**           | 4     | Neon, MongoDB Atlas, ElastiCache, R2                                                                 |
| **Messaging**         | 2     | SQS, Inngest                                                                                         |
| **Auth**              | 1     | Clerk                                                                                                |
| **Integrations**      | 3     | Stripe, Resend, Pusher                                                                               |
| **Observability**     | 2     | Sentry, PostHog                                                                                      |
| **Security**          | 1     | Secrets Manager                                                                                      |
| **Total Services**    | 20    |                                                                                                      |
| **Total Connections** | 33    |                                                                                                      |
