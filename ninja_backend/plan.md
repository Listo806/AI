SaaS-native backend project

Milestone Structure:

Milestone 1 – Foundation, Environment & Auth
	Scope
	- Backend environment setup (Node / Nest)
	- Database connection and schema initialization
	- Environment variables configured (local + staging)
	- Authentication system:
	- Login / signup
	- JWT access + refresh tokens
	- Secure password handling
	- Role-based access control: Owner, Agent, Developer / Admin
	- Backend reachable and authenticated
	- Exit Criteria
	- Auth works end-to-end
	- Roles enforced server-side
Milestone 2 – Core Domain APIs
	Scope
	- Teams & seat management
		Team creation
		Seat limits
		Role enforcement per team
	- Leads module
		Lead creation
		Assignment
		Status updates
	- Properties module
		Create / edit / publish
		Sale / rent flags
		Media handling
	- Server-side validation & permissions
	- Exit Criteria
	- Core APIs functional
	- Seat and role enforcement active
Milestone 3 – Payments & Subscriptions
	Scope
	- PayPal subscription integration
	- Plan mapping and seat-based billing logic
	- Webhook handling: Subscription create / update / cancel
	- Seat changes enforced automatically
	- Payment state enforced server-side
	- Access restrictions based on subscription status
	- Exit Criteria
	- Billing fully automated
	- Seats enforced immediately via webhooks
Milestone 4 – Third-Party Integrations
	Scope
	- Mapbox integration (properties + location)
	- WhatsApp API (API-level only)
	- AI assistant backend endpoints
	- Push notifications (Web / PWA)
	- Cloud storage for uploads
	- Integration isolation via service wrappers
	- Exit Criteria
	- All integrations live
	- No blocking of core flows
Milestone 5 – Analytics & Reporting
	Scope
	- Event logging for core actions
	- Analytics endpoints (read-only)
	- Weekly report generation
	- Monthly report generation
	- Admin visibility for metrics
	- Exit Criteria
	- Reports generated correctly
	- Metrics align with system data
Milestone 6 – Frontend Integration & QA
	Scope
	- Connect backend APIs to existing Netlify frontend
	- Validate all user flows: Owner, Agent, Admin
	- Subscription lifecycle testing
	- Lead, property, team, and payment validation
	- Backend-only bug fixes
	- Exit Criteria
	- Frontend fully functional with real backend data

Milestone 7 – Deployment & Production Readiness
	Scope
	- Production deployment (Render / Railway / AWS)
	- Production environment variables
	- Logging and error handling
	- Basic security checks (rate limiting, auth guards)
	- Final end-to-end verification
	- Exit Criteria
	- System live, stable, and production-ready