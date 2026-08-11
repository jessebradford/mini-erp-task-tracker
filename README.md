# Mini ERP Task Tracker

A small three-layer task-tracking application built with Cloudflare Pages, Cloudflare Workers, Cloudflare D1, and GitHub.

## Live Application

Frontend:

https://mini-erp-task-tracker.pages.dev

Worker API:

https://mini-erp-task-tracker-api.jessebradford10.workers.dev

GitHub Repository:

https://github.com/jessebradford/mini-erp-task-tracker

## Application Features

Users can:

- View all tasks
- Create new tasks
- Edit existing tasks
- Mark tasks as completed
- Delete tasks
- Filter tasks by status

Each task contains:

- ID
- Title
- Description
- Assigned employee
- Status
- Priority
- Due date
- Created date
- Updated date

Supported status values:

- Open
- In Progress
- Blocked
- Completed

Supported priority values:

- Low
- Medium
- High

## Architecture

The application uses a three-layer architecture:

```text
Browser
   |
   | HTTPS / fetch()
   v
Cloudflare Pages
Static HTML, CSS, and JavaScript
   |
   | REST API requests
   v
Cloudflare Worker
API and validation layer
   |
   | Parameterized SQL
   v
Cloudflare D1
Relational database