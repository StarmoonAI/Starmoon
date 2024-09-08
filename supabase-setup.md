# Configuring Supabase

This document provides a comprehensive guide on how to configure Supabase in Starmoon, detailing CLI usage, running migrations, resetting the database, and deploying to a hosted version of Supabase.

## Prerequisites

Before you begin, ensure you have the following:

- Make sure [Docker](https://docs.docker.com/get-started/get-docker/) is running

- [Create a Supabase account](https://supabase.com/dashboard/sign-up)

- Install Supabase CLI to your machine

    ```bash
    # for macOS or Linux
    brew install supabase/tap/supabase
    # for Windows
    scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
    scoop install supabase
    ```

<!-- ### 1. Create a Hosted Supabase project

- Login and create a hosted Supabase project and follow the instructions

    ```bash
    supabase login
    ```

    ```bash
    supabase projects create <your-project-name>
    ```

    After creating an instance, you will see this link in the terminal `https://supabase.com/dashboard/project/<project-id>` and remember your `<project-id>`.

- Link your hosted Supabase

    ```bash
    supabase link --project-ref <project-id>
    # You can get <project-id> from your project's dashboard URL: https://supabase.com/dashboard/project/<project-id>
    ```

- Go to `https://supabase.com/dashboard/project/<replace-project-id>/settings/api` to set up `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `JWT_SECRET_KEY` in your `.env` file.

### 2. Apply migration through Supabase CLI

- Start the Supabase stack

    ```bash
    supabase start
    ```

- Apply the migration

    ```bash
    supabase db reset
    ```

### 3. Push migration to Hosted Supabase

- Deploy your Supabase CLI instance to a hosted Supabase:

    ```bash
    supabase db push
    ```

- After you deployed to a hosted Supabase, you can stop the local Supabase CLI instance to release resources:

    ```bash
    supabase stop
    ``` -->

## Conclusion

By following these steps, you can successfully configure Supabase in Starmoon, making use of its powerful database service to enhance your project.
