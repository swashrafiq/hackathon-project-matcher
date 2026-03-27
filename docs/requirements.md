# Hackathon Project Matcher - Product Requirements Document (PRD)

## Document Control
- **Version:** 1.0
- **Status:** Draft
- **Product Name:** Hackathon Project Matcher
- **Platform:** Web app (desktop-first, responsive)
- **Tech Stack:** React, TypeScript, Vite
- **Event Scope:** Single hackathon event

## 1. Overview

### 1.1 Problem Statement
During hackathons, participants often struggle to quickly discover interesting projects, understand who is working on what, and organize teams efficiently.

### 1.2 Product Vision
Build a simple, fast web app that helps participants browse coding projects, join one project, watch multiple projects, and propose new ideas so teams form faster with less confusion.

### 1.3 Target Users
- Hackathon participants who want to discover, join, or create coding projects
- One event admin who coordinates and manages projects

## 2. Goals and Non-Goals

### 2.1 Goals
- Provide a clear list of active projects as cards
- Show project details and participant count
- Let users join exactly one main project at a time
- Let users switch projects or give up a current project
- Let users watch multiple projects without joining them
- Let users create project ideas and publish them immediately
- Keep onboarding simple with name and email entry
- Provide both dark and light themes for accessibility and user preference

### 2.2 Non-Goals
- Multi-event support
- Complex authentication (SSO, OAuth, password reset)
- Team chat, messaging, or file sharing
- Automatic project lifecycle workflows (beyond admin manual completion)

## 3. User Roles

### 3.1 Participant
- Enters name and email to access the app
- Browses and searches project cards
- Views project details
- Joins one main project (if capacity allows)
- Watches multiple projects
- Switches main project or gives it up
- Creates and publishes a new project idea

### 3.2 Admin
- Single admin user for the event
- Can view and manage all projects
- Can mark projects as completed manually

## 4. Core User Flows

### 4.1 Participant Onboarding
1. User opens app
2. User enters name and email
3. User lands on project browsing page

### 4.2 Browse and Inspect Projects
1. User sees project cards
2. User selects a card
3. User views full details (title, description, tech stack, lead name, member count, status)

### 4.3 Join a Project
1. User selects project
2. User clicks **Join**
3. System validates:
   - Project is active
   - Capacity is not full (max 5 members)
   - User does not already have a different main project
4. User becomes a member of the selected project

### 4.4 Switch or Give Up Main Project
1. User opens current main project
2. User selects **Switch** to another project or **Give Up**
3. System updates membership and counters immediately

### 4.5 Watch Projects
1. User marks projects as **Watch**
2. User can watch multiple projects at once
3. Watching does not affect main project membership

### 4.6 Propose a New Project
1. User opens **Create Project**
2. User enters required fields: title, description, tech stack, lead name
3. User submits
4. Project is published immediately (no review)
5. Creator is automatically assigned as the project member and this project becomes creator's main project
6. Creator cannot join any additional main project unless they switch or give up current one

## 5. Functional Requirements

### FR-1: User Entry
- The system must allow users to enter name and email before using app features.
- The system must block access to project actions until name and email are provided.

### FR-2: Project List (Cards)
- The system must display projects as cards.
- Each card must show: title, short description, and member count.
- The system must support viewing all active projects.

### FR-3: Project Details
- The system must provide a details view showing:
  - Title
  - Description
  - Tech stack
  - Lead name
  - Member count
  - Status (active/completed)

### FR-4: Main Project Membership (One at a Time)
- A participant must have at most one main project at any time.
- The system must prevent joining a second main project directly.
- The system must allow switching to another project in one flow.

### FR-5: Project Capacity
- Each project must allow a maximum of 5 members.
- The system must prevent joins when capacity is reached.

### FR-6: Give Up Current Project
- The system must let users leave their current main project.
- Leaving must decrement project member count immediately.

### FR-7: Watchlist
- The system must let users watch multiple projects.
- Watching must be independent from main membership.
- A watched project must be clearly marked for the user.

### FR-8: Project Creation
- The system must allow participants to create new projects with required fields:
  - Title
  - Description
  - Tech stack
  - Lead name
- New projects must be publicly visible immediately after creation.
- Project creator must automatically become a member of that project.

### FR-9: Project Status Management
- All projects can be active by default.
- Admin can manually mark projects as completed.
- Completed projects remain visible but cannot be joined.

### FR-10: Admin Role
- The system must support one admin user for event coordination.
- Admin can manage project status and oversee project list.

### FR-11: Theme Modes (Dark and Light)
- The system must provide both dark mode and light mode.
- The system must include a visible theme toggle so users can switch modes at any time.
- The selected theme must be applied consistently across all primary pages and core actions.

## 6. Business Rules
- BR-1: Single event only.
- BR-2: One participant can have one main project at a time.
- BR-3: Participant can watch multiple projects.
- BR-4: Project capacity is 5 participants.
- BR-5: New project creation is public and does not require approval.
- BR-6: Project creator is auto-assigned to the created project as main project member.
- BR-7: Admin can manually complete projects.

## 7. Non-Functional Requirements

### 7.1 Usability
- Desktop-first interface with responsive behavior for smaller screens.
- Main actions (Join, Switch, Give Up, Watch, Create) should be obvious and accessible in <= 2 clicks from major screens.
- UI must support consistent dark and light themes across all primary pages and actions.

### 7.2 Performance
- Project card list should render quickly for typical hackathon usage.
- Membership and watch actions should update UI instantly or near real-time from user perspective.

### 7.3 Reliability
- Membership constraints (single main project, capacity limit) must always be enforced.
- Counters should stay consistent after join/leave/switch/create actions.

### 7.4 Security and Privacy
- Collect only name and email for participant identity.
- Do not expose unnecessary personal information.

## 8. Data Model (Logical)

### 8.1 User
- `id`
- `name`
- `email`
- `role` (`participant` | `admin`)
- `mainProjectId` (nullable)
- `watchedProjectIds[]`

### 8.2 Project
- `id`
- `title`
- `description`
- `techStack`
- `leadName`
- `memberCount`
- `status` (`active` | `completed`)
- `createdByUserId`
- `memberIds[]` (max length 5)

## 9. Success Metrics
- Time for a new participant to join a project after first app visit
- Number of projects discovered per participant (views and watches)
- Ratio of participants assigned to projects during event
- Number of project switches completed without admin help
- Number of user-created projects adopted by others

## 10. Acceptance Criteria (MVP)
- Participant can enter name and email and access app
- Participant can browse project cards and open details
- Participant can join one active project if capacity < 5
- Participant cannot hold more than one main project simultaneously
- Participant can switch from one project to another
- Participant can give up current project
- Participant can watch multiple projects
- Participant can create a new project with required fields
- New project is visible immediately and creator is auto-joined
- Admin can mark a project as completed
- Completed projects cannot be newly joined
- UI is desktop-first and responsive
- Dark and light modes are both implemented across core user flows
- Users can switch between dark and light modes using a theme toggle

## 11. Open Implementation Notes
- Since this PRD is for a single event MVP, data persistence can be implemented in a simple backend or lightweight database according to team preference.
- If backend is deferred, prototype mode can use local/mock data with clear migration path.
