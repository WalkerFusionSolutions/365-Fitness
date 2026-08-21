# 365 Fitness - Backend & Database Security Documentation

This document outlines the security architecture, database schema constraints, Row Level Security (RLS) policies, and implementation decisions for the 365 Fitness backend.

---

## 1. Current Architecture

The application uses:
- **Frontend:** React Native (Expo) built with TypeScript.
- **Backend/Auth/Database:** Supabase (PostgreSQL with built-in GoTrue Auth).
- **Client Configuration:** Local environment variables loaded into the client:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Session Persistence:** AsyncStorage.

> [!CAUTION]
> **No Service Role Keys in Client**
> The client-side application only uses the publishable/anon key. The service-role key is never stored or used in the frontend codebase to prevent complete administrative access compromise.

---

## 2. Database Migration Structure

Migrations are organized inside the `supabase/migrations/` directory and are named sequentially to ensure clean execution:

1. **`20240820180000_enable_uuid_extension.sql`**: Ensures that the `uuid-ossp` extension is loaded for generating UUIDs.
2. **`20240820180001_handle_new_user_and_role_protection.sql`**: Sets up automatic profile creation on user signup and defines triggers to prevent role escalation.
3. **`20240820180002_coach_client_assignments.sql`**: Creates the `coach_client_assignments` table, sets up triggers to enforce valid role combinations, and establishes assignment status restrictions.
4. **`20240820180003_is_assigned_coach_and_rls_policies.sql`**: Implements the assignment authorization helper function and configures strict, assignment-scoped RLS policies across all data tables (workouts, progress, messages, etc.).

---

## 3. Signup Role Behavior & Protection

### Client Signups
Public signup is handled via `supabase.auth.signUp()`. The app has been modified to remove the client/coach role picker. Public signups can provide a display name (`full_name`) but cannot choose their security role. 

### Database-Enforced Client Role
Even if a malicious user attempts to pass a custom role (e.g. `role: 'coach'`) in the auth signup metadata, the database trigger on user creation bypasses the metadata role field and explicitly forces the new user profile to have the `client` role:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'client'::user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;
```

---

## 4. Role Protection (Self-Elevation Defense)

To prevent a logged-in client from executing an update query to change their role to `coach`, a database trigger is executed `BEFORE UPDATE` on the `profiles` table:

```sql
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF auth.uid() IS NOT NULL THEN
      RAISE EXCEPTION 'Role changes require administrator privileges';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
```

Because `auth.uid()` is only populated for requests authenticated via JWT (client connections), any client-side update containing a modified role is rejected with an exception. Only backend service keys or administrative SQL executes can modify a user's role.

---

## 5. Coach-Client Assignment Architecture

Without an assignment model, a coach could query and access data for any client in the database. To prevent this, the `coach_client_assignments` table acts as a junction table controlling coach authorization.

### Database Constraints
- **Self-Assignment Prevention**: Enforced via `CHECK (coach_id <> client_id)`.
- **Duplicate Prevention**: Enforced via `UNIQUE (coach_id, client_id)`.
- **Role Verification Trigger**: Before insert or update, a database trigger queries the `profiles` table to verify that the `coach_id` profile has the `'coach'` role and the `client_id` profile has the `'client'` role.

### Assignment Scoping (Harden Option)
To prevent coaches from unilaterally assigning and instantly accessing arbitrary client data, the policies are structured as follows:
- **Coaches** can only INSERT assignments with `status = 'pending'`.
- **Coaches** can update their assignments to cancel/archive them but CANNOT update status to `'active'`.
- **Clients** can insert assignments and update their status (accepting/activating them).
- Access to client data is strictly restricted to assignments with `status = 'active'`.

---

## 6. Row Level Security (RLS) Model

All tables containing client data have Row Level Security enabled. Policies are partitioned by user role:

### The Authorization Helper
The helper function `is_assigned_coach` is used across all coach RLS policies. It is defined with `SECURITY DEFINER` and a fixed `search_path` to avoid recursive RLS evaluations:

```sql
CREATE OR REPLACE FUNCTION public.is_assigned_coach(coach_uuid uuid, client_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM coach_client_assignments
    WHERE coach_id = coach_uuid AND client_id = client_uuid AND status = 'active'::assignment_status
  );
$$;
```

### Table Policies Summary

| Table | Client Policy | Coach Policy |
| :--- | :--- | :--- |
| **`profiles`** | Select own; Update own | Select if active assignment |
| **`coach_client_assignments`** | Select own; Insert/Update own | Select own; Insert pending; Update status <> 'active' |
| **`medical_questionnaire`** | Select/Insert/Update/Delete own | Select if active assignment |
| **`goals`** | Select/Insert/Update/Delete own | Select if active assignment |
| **`measurements`** | Select/Insert/Update/Delete own | Select if active assignment |
| **`progress_photos`** | Select/Insert/Update/Delete own | Select if active assignment |
| **`workouts`** | Select own workouts | Manage (ALL) if coach is assigned & active |
| **`workout_exercises`** | Select own workouts | Manage (ALL) if coach is assigned & active |
| **`workout_logs`** | Manage (ALL) own logs | Select if active assignment |
| **`completed_workouts`** | Manage (ALL) own completions | Select if active assignment |
| **`meal_plans`** | Select own meal plans | Manage (ALL) if coach is assigned & active |
| **`meal_plan_meals`** | Select own meals | Manage (ALL) if coach is assigned & active |
| **`supplements`** | Manage (ALL) own | Select if active assignment |
| **`reports`** | Select own | Select/Insert if active assignment |
| **`messages`** | Select own; Insert if active assignment | Select own; Insert if active assignment |

---

## 7. How Coaches Will Eventually Be Provisioned

Because public signup does not allow choosing the `coach` role, coaches must be provisioned through a secure administrative flow.

### Option A: Direct SQL Execution (Recommended for Early Stage)
Administrators can update a user's role directly in the Supabase SQL Editor:
```sql
UPDATE public.profiles
SET role = 'coach'::user_role
WHERE id = 'COACH_USER_UUID';
```

### Option B: Administrative Dashboard API
A backend service route or Edge Function using the Supabase Service Role Key (`service_role`) can update the profile:
```typescript
const { data, error } = await supabaseAdmin
  .from('profiles')
  .update({ role: 'coach' })
  .eq('id', coachUserId);
```

---

## 8. Remaining Backend & Security Work

Once the security foundation is applied, the next steps include:
1. **TypeScript Interface Generation**: Generating database schema types from Supabase and integrating them into `src/types/`.
2. **Service Layer Implementation (Phase 2)**: Creating clean client-side service wrappers (`auth.service.ts`, `profiles.service.ts`, `workouts.service.ts`, etc.) to interface with the database.
3. **Trigger Refinements**: Setting up automatic deletion hooks on the auth schema if a user profile is manually deleted.
