require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'family-store',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p ' + (process.env.PORT || 3000),
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        DB_HOST: process.env.DB_HOST,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_NAME: process.env.DB_NAME,
        DB_PORT: process.env.DB_PORT,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        XENDIT_SECRET_KEY: process.env.XENDIT_SECRET_KEY,
        XENDIT_PUBLIC_KEY: process.env.XENDIT_PUBLIC_KEY,
      },
    },
  ],
};
