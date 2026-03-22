# Team Branch Structure - Printing Management System

## Overview
This project uses a **feature-branch workflow** where each team member has their own dedicated branch for their module. All code is integrated on the `main` branch.

---

## Branch Assignments

| Branch Name | Team Member | Email | Module | Responsibility |
|---|---|---|---|---|
| `feature/inventory-management` | Senala Nuraheesara | senalanuraheesara@gmail.com | Inventory Management | Machines, Materials, Stock Transactions |
| `feature/order-management` | Nimani Thathsarani | nimani2thathsarani@gmail.com | Order Management | Orders, Design Templates, Customer Requests, Shop Orders |
| `feature/billing-management` | Sanith Wijesinghe | sanithwijesinghe30@gmail.com | Billing Management | Invoices, Payments, Invoice Generation |
| `feature/feedback-notification` | Abisheka | abisheka12345@gmail.com | Feedback & Notifications | Notifications, Feedback, Vendor Communication |
| `feature/user-management` | Sachintha | Sachintha-11 | User Management | Authentication, User Profiles, Roles & Permissions |
| `feature/schedule-management` | Omeshi Rathnayake | omeshirathnayake@gmail.com | Schedule Management | Production Scheduling, Resource Allocation |
| `main` | **Integration** | N/A | All Modules | Stable, fully integrated version |

---

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd printing-management-system
```

### 2. Switch to Your Feature Branch
Replace `YOUR_BRANCH` with your assigned branch:
```bash
git checkout feature/YOUR-MODULE-NAME
```

Example:
```bash
git checkout feature/inventory-management
```

### 3. Verify Your Branch
```bash
git branch          # Shows current branch (marked with *)
git log --oneline   # Shows commit history
```

---

## Development Workflow

### For Your Specific Module

#### 1. **Make Changes**
- Modify files in your assigned module folder:
  - Server: `/server/modules/YourModule/`
  - Client: `/client/pages/YourModule/`
  - Shared services in `/server/services/` if needed

#### 2. **Commit Your Work**
```bash
git add .
git commit -m "Description of your changes"
```

#### 3. **Pull Latest from Main** (before pushing)
```bash
git fetch origin main
git merge origin/main   # or git rebase origin/main
```

#### 4. **Push Your Branch**
```bash
git push origin feature/YOUR-MODULE-NAME
```

---

## Important Guidelines

✅ **DO:**
- Keep your branch focused on your module only
- Write clear, descriptive commit messages
- Test your changes before pushing
- Pull from `main` regularly to stay in sync
- Create pull requests for code review

❌ **DON'T:**
- Commit changes to other team members' modules
- Push directly to `main` branch
- Merge your branch without PR review
- Use the `main` branch for development

---

## Creating a Pull Request (Code Review)

When your feature is ready:

1. **Push your branch** to the repository
2. **Create a Pull Request** on GitHub/GitLab with:
   - Clear title: `feat: Add [specific feature]`
   - Description of changes
   - Link to any related issues
3. **Request reviews** from team leads
4. **Address feedback** and re-push commits
5. **Merge** once approved

---

## Staying Synchronized

To keep your branch updated with the latest main code:

```bash
# Fetch latest changes from remote
git fetch origin

# Option 1: Merge main into your branch
git merge origin/main

# Option 2: Rebase your changes on top of main (cleaner history)
git rebase origin/main

# Push updated branch
git push origin feature/YOUR-MODULE-NAME
```

---

## Useful Git Commands

```bash
# See all branches
git branch -a

# Create a new branch from main
git checkout main
git pull origin main
git checkout -b feature/new-feature

# See what changed
git status
git diff

# Undo last commit (before pushing)
git reset --soft HEAD~1

# Revert a file to last commit
git checkout -- path/to/file

# See detailed log
git log --oneline --graph --all
```

---

## Need Help?

- **Merge conflicts?** → Ask a lead developer
- **Lost commits?** → Use `git reflog` to recover
- **Accidentally pushed to main?** → Contact admin immediately
- **Git errors?** → Check with your team lead

---

## Server Modules Structure
- `/server/modules/BillingManagement/` → Invoices, Payments
- `/server/modules/FeedbackNotificationManagement/` → Notifications, Feedback
- `/server/modules/InventoryManagement/` → Machines, Materials, Stock
- `/server/modules/OrderManagement/` → Orders, Templates, Requests
- `/server/modules/ScheduleManagement/` → Schedule Management
- `/server/modules/UserManagement/` → Auth, Users, Roles

---

**Last Updated:** March 20, 2026  
**Git Initialized:** Yes ✓
