use std::env;

pub struct AppEnv {
    pub supabase_service_key: String,
    pub jwt_secret: String,
    pub sentry_dsn: Option<String>,
    pub database_url: String,
}

impl AppEnv {
    pub fn load() -> Result<Self, String> {
        // Load from .env.backend file
        dotenv::from_filename(".env.backend").ok();

        Ok(Self {
            supabase_service_key: env::var("SUPABASE_SERVICE_ROLE_KEY")
                .map_err(|_| "SUPABASE_SERVICE_ROLE_KEY not set")?,
            jwt_secret: env::var("JWT_SECRET")
                .map_err(|_| "JWT_SECRET not set")?,
            sentry_dsn: env::var("SENTRY_DSN").ok(),
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "./stride.db".to_string()),
        })
    }
}
