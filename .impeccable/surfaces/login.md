---
version: 1
slug: "login"
primary_target: "route:/login"
related_targets: []
---

# Login

**Mode:** Operate

Authentication page for internal Feryshop staff. Uses Supabase auth with RBAC. Redirects to /dashboard on successful login.

## Sections

- Authentication form with email/password
- Error state handling
- Redirect to dashboard on success
