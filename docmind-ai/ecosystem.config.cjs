module.exports = {
  apps: [
    {
      name: "docmind-ai",
      script: "npm",
      args: "run preview -- --host 0.0.0.0 --port 3001",
      env_production: {
        NODE_ENV: "production",
        SUPABASE_URL: "https://mhwwpipejrakwcaorslb.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fvJnk5lnxNButUythXniPg_FdnvijYX",
        VITE_SUPABASE_URL: "https://mhwwpipejrakwcaorslb.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fvJnk5lnxNButUythXniPg_FdnvijYX",
        VITE_API_MODE: "live",
        VITE_API_BASE: "http://localhost:8000"
      }
    }
  ]
};
