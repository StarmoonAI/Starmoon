---
title: Supabase
description: Comprehensive guide on setting up Supabase for Starmoon, including CLI usage, migrations, database reset, and deployment.
---

## Configuring Supabase

This document provides a comprehensive guide on how to configure Supabase in Starmoon, detailing CLI usage, running migrations, resetting the database, and deploying to a hosted version of Supabase.

## Prerequisites

Before you begin, ensure you have the following:

- Make sure [Docker](https://docs.docker.com/get-started/get-docker/) is running

- [Create a Supabase account](https://supabase.com/dashboard/sign-up)

- Install Supabase CLI to your machine

```bash
# for macOS
brew install supabase/tap/supabase
# for Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
# for Linux
brew install supabase/tap/supabase
```

## Setting Up Supabase

### 1. Create a Hosted Supabase project

- Login and create a Supabase project and follow its instructions

```bash
supabase login
```

```bash
supabase projects create <your-project-name>
```

- After creating an instance, you will see this link in the terminal `https://supabase.com/dashboard/project/<project-id>` and remember your `<project-id>`.

- Go to `https://supabase.com/dashboard/project/<replace-project-id>/settings/api` and set up `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your `.env` file.

### 2. Start the Supabase CLI

To start, initialize a new Supabase project:

```bash
supabase start
```

```bash
supabase db reset
```

### 3. Sync schema to Hosted Supabase

- Link your local Supabase to a hosted Supabase:

```bash
supabase link --project-ref <project-id>
# You can get <project-id> from your project's dashboard URL: https://supabase.com/dashboard/project/<project-id>
```

- Deploy your local Supabase to a hosted Supabase:

```bash
supabase db push --linked
```

- After you deployed to a hosted Supabase, you can stop the local Supabase instance to release resources:

```bash
supabase stop
```

## Conclusion

By following these steps, you can successfully configure Supabase in Starmoon, making use of its powerful database and backend services to enhance your project.
