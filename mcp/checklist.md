# Checklist before letting an AI agent touch your database

- [ ] You are connecting to a **development project, not production**
- [ ] The URL has **`project_ref=`** (scope)
- [ ] If you don't need writes: **`read_only=true`** (no writes)
- [ ] **`features=`** lists only the tool groups you need (tools)
- [ ] The AI's actions are still set to **manual approval**
- [ ] You understand that even "read-only" can **see everything in its reach** (in my check, this role skipped RLS)
- [ ] Be extra careful if the data contains **text written by other people** (support tickets, comments, etc.): prompt injection
