
  # Create Account File

  This is a code bundle for Create Account File. The original project is available at https://www.figma.com/design/PEVJ2uEWNUbNsAmx2ch3vI/Create-Account-File.

  ## Running the code

  Run `npm i` to install the dependencies.

  ### Supabase Setup
  
  1. Create a project at [Supabase](https://supabase.com).
  2. In your Supabase Dashboard, go to **SQL Editor** and run the contents of `supabase/migrations/00001_schema.sql` followed by `supabase/migrations/00002_rls.sql`.
  3. Create a `.env` file based on `.env.example` and fill in your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

  Run `npm run dev` to start the development server.