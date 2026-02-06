#!/usr/bin/env tsx

import inquirer from 'inquirer';
import { writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import chalk from 'chalk';
import path from 'path';
import yaml from 'js-yaml';

// Default local Supabase Postgres URL — derived from supabase config.toml defaults.
// Only used as an initial placeholder; start-local.sh overwrites with the real value.
const DEFAULT_LOCAL_PG_URL = `postgresql://postgres:postgres@localhost:54322/postgres`;
const DEFAULT_DOCKER_PG_URL = `postgresql://postgres:postgres@host.docker.internal:54322/postgres`;

interface SetupConfig {
  localOnly: boolean;
  selfHostSupabase: boolean;
  selfHostPowerSync: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceKey?: string;
  supabasePgUrl?: string;
  powersyncUrl?: string;
  smtpService: 'mailpit' | 'resend' | 'none';
  resendApiKey?: string;
  seedData: 'essential' | 'minimal' | 'complete' | 'none';
  sentryDsn?: string;
  sentryDsnBackend?: string;
}

async function main() {
  console.log(chalk.blue.bold('\n🚀 Stride Desktop Environment Setup\n'));

  checkPrerequisites();

  const envPath = path.join(process.cwd(), '.env.local');
  const envBackendPath = path.join(process.cwd(), 'src-tauri', '.env.backend');

  if (existsSync(envPath) || existsSync(envBackendPath)) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: 'Environment files exist. Overwrite?',
      default: false
    }]);

    if (!overwrite) {
      console.log(chalk.yellow('Aborting.'));
      process.exit(0);
    }
  }

  const config = await gatherConfiguration();
  generateEnvironmentFiles(config);

  if (!config.localOnly && (config.selfHostPowerSync || config.smtpService === 'mailpit')) {
    generateDockerCompose(config);
  }

  if (!config.localOnly && (config.selfHostSupabase || config.selfHostPowerSync)) {
    const { startNow } = await inquirer.prompt([{
      type: 'confirm',
      name: 'startNow',
      message: 'Start services now?',
      default: true
    }]);

    if (startNow) {
      console.log(chalk.blue('\n🐳 Starting services...\n'));

      try {
        execSync('./scripts/start-local.sh', {
          stdio: 'inherit',
          cwd: process.cwd()
        });

        displayServiceUrls(config);
      } catch (error) {
        console.error(chalk.red('Failed to start services:'), error);
        process.exit(1);
      }
    }
  }

  console.log(chalk.green.bold('\n✅ Setup complete!\n'));

  if (!config.localOnly) {
    console.log(chalk.blue('🎯 Next step: yarn dev'));
  } else {
    console.log(chalk.blue('🎯 Running in local-only mode (no cloud sync)'));
  }
}

function checkPrerequisites() {
  const required = ['docker'];
  const missing: string[] = [];

  for (const cmd of required) {
    try {
      execSync(`which ${cmd}`, { stdio: 'ignore' });
    } catch {
      missing.push(cmd);
    }
  }

  if (missing.length > 0) {
    console.error(chalk.red(`❌ Missing prerequisites: ${missing.join(', ')}`));
    console.error(chalk.yellow('Install Docker Desktop to continue.'));
    process.exit(1);
  }
}

async function gatherConfiguration(): Promise<SetupConfig> {
  const config: Partial<SetupConfig> = {};

  const { localOnly } = await inquirer.prompt([{
    type: 'confirm',
    name: 'localOnly',
    message: 'Run in local-only mode? (No cloud sync, SQLite only)',
    default: false
  }]);

  config.localOnly = localOnly;

  if (localOnly) {
    config.selfHostSupabase = false;
    config.selfHostPowerSync = false;
    config.smtpService = 'none';
    config.seedData = 'none';
    return config as SetupConfig;
  }

  const { selfHostSupabase } = await inquirer.prompt([{
    type: 'confirm',
    name: 'selfHostSupabase',
    message: 'Self-host Supabase locally? (Recommended for development)',
    default: true
  }]);

  config.selfHostSupabase = selfHostSupabase;

  if (!selfHostSupabase) {
    const supabaseAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'supabaseUrl',
        message: 'Supabase Project URL:',
        validate: (input) => input.startsWith('http') || 'Must be a valid URL'
      },
      {
        type: 'input',
        name: 'supabaseAnonKey',
        message: 'Supabase Anon Key:',
        validate: (input) => input.length > 20 || 'Invalid key'
      },
      {
        type: 'password',
        name: 'supabaseServiceKey',
        message: 'Supabase Service Role Key:',
        validate: (input) => input.length > 20 || 'Invalid key'
      },
      {
        type: 'input',
        name: 'supabasePgUrl',
        message: 'PostgreSQL Connection String:',
        validate: (input) => input.startsWith('postgresql://') || 'Must start with postgresql://'
      }
    ]);

    Object.assign(config, supabaseAnswers);
  } else {
    config.supabasePgUrl = DEFAULT_LOCAL_PG_URL;
  }

  const { selfHostPowerSync } = await inquirer.prompt([{
    type: 'confirm',
    name: 'selfHostPowerSync',
    message: 'Self-host PowerSync locally? (Recommended for development)',
    default: true
  }]);

  config.selfHostPowerSync = selfHostPowerSync;

  if (!selfHostPowerSync) {
    const { powersyncUrl } = await inquirer.prompt([{
      type: 'input',
      name: 'powersyncUrl',
      message: 'PowerSync URL:',
      validate: (input) => input.startsWith('http') || 'Must be a valid URL'
    }]);

    config.powersyncUrl = powersyncUrl;
  }

  const { smtpService } = await inquirer.prompt([{
    type: 'list',
    name: 'smtpService',
    message: 'Choose SMTP service:',
    choices: [
      {
        name: 'Mailpit (local email testing, web UI) - Recommended for dev',
        value: 'mailpit',
        short: 'Mailpit'
      },
      {
        name: 'Resend (production email service)',
        value: 'resend',
        short: 'Resend'
      },
      {
        name: 'None (skip email setup)',
        value: 'none',
        short: 'None'
      }
    ],
    default: selfHostSupabase ? 'mailpit' : 'resend'
  }]);

  config.smtpService = smtpService;

  if (smtpService === 'resend') {
    const { resendApiKey } = await inquirer.prompt([{
      type: 'password',
      name: 'resendApiKey',
      message: 'Resend API Key:',
      validate: (input) => input.startsWith('re_') || 'Invalid Resend API key'
    }]);

    config.resendApiKey = resendApiKey;
  }

  const { seedData } = await inquirer.prompt([{
    type: 'list',
    name: 'seedData',
    message: 'Seed database with sample data?',
    choices: [
      {
        name: 'Essential (roles, permissions, basic app config only)',
        value: 'essential'
      },
      {
        name: 'Minimal (3 users, 1 workspace, 5 tasks)',
        value: 'minimal'
      },
      {
        name: 'Complete (full demo data)',
        value: 'complete'
      },
      {
        name: 'None (empty database)',
        value: 'none'
      }
    ],
    default: 'minimal'
  }]);

  config.seedData = seedData;

  const { useSentry } = await inquirer.prompt([{
    type: 'confirm',
    name: 'useSentry',
    message: 'Configure Sentry for error tracking?',
    default: true
  }]);

  if (useSentry) {
    const { sentryDsn, sentryDsnBackend } = await inquirer.prompt([
      {
        type: 'input',
        name: 'sentryDsn',
        message: 'Sentry DSN (frontend):',
        validate: (input) => input.includes('sentry.io') || input === '' || 'Invalid Sentry DSN'
      },
      {
        type: 'input',
        name: 'sentryDsnBackend',
        message: 'Sentry DSN (backend, or press enter for same):',
        default: (answers: any) => answers.sentryDsn
      }
    ]);

    config.sentryDsn = sentryDsn;
    config.sentryDsnBackend = sentryDsnBackend;
  }

  return config as SetupConfig;
}

function generateEnvironmentFiles(config: SetupConfig) {
  const frontendEnv = generateFrontendEnv(config);
  writeFileSync('.env.local', frontendEnv);
  console.log(chalk.green('✓ Created .env.local'));

  const backendEnv = generateBackendEnv(config);
  writeFileSync('src-tauri/.env.backend', backendEnv);
  console.log(chalk.green('✓ Created src-tauri/.env.backend'));
}

function generateFrontendEnv(config: SetupConfig): string {
  const lines = [
    `# Stride Desktop - Frontend Configuration`,
    `# Generated: ${new Date().toISOString()}`,
    ``,
    `# Local-only mode`,
    `VITE_LOCAL_ONLY=${config.localOnly}`,
    ``,
  ];

  if (config.localOnly) {
    lines.push(
      `# Running in local-only mode (no cloud services)`,
      `VITE_ENABLE_SYNC=false`,
      ``
    );
    return lines.join('\n');
  }

  if (config.selfHostSupabase) {
    lines.push(
      `# Supabase (self-hosted)`,
      `VITE_SUPABASE_URL=http://supabase.stride.local`,
      `VITE_SUPABASE_ANON_KEY=(will be auto-generated)`,
      ``
    );
  } else if (config.supabaseUrl) {
    lines.push(
      `# Supabase (managed)`,
      `VITE_SUPABASE_URL=${config.supabaseUrl}`,
      `VITE_SUPABASE_ANON_KEY=${config.supabaseAnonKey}`,
      ``
    );
  }

  if (config.selfHostPowerSync) {
    lines.push(
      `# PowerSync (self-hosted)`,
      `VITE_POWERSYNC_URL=http://powersync.stride.local`,
      ``
    );
  } else if (config.powersyncUrl) {
    lines.push(
      `# PowerSync (managed)`,
      `VITE_POWERSYNC_URL=${config.powersyncUrl}`,
      ``
    );
  }

  if (config.sentryDsn) {
    lines.push(
      `# Sentry (frontend)`,
      `VITE_SENTRY_DSN=${config.sentryDsn}`,
      ``
    );
  }

  lines.push(
    `# Feature flags`,
    `VITE_ENABLE_SYNC=true`,
    `VITE_LOG_LEVEL=debug`,
    ``,
    `# Seed data (for startup script)`,
    `SEED_DATA=${config.seedData}`,
    ``
  );

  return lines.join('\n');
}

function generateBackendEnv(config: SetupConfig): string {
  const lines = [
    `# Stride Desktop - Backend Configuration`,
    `# Generated: ${new Date().toISOString()}`,
    `# ⚠️ KEEP PRIVATE - Contains sensitive keys`,
    ``,
  ];

  if (config.localOnly) {
    lines.push(
      `# Local-only mode`,
      `DATABASE_URL=./stride.db`,
      ``
    );
    return lines.join('\n');
  }

  lines.push(
    `# Database`,
    `DATABASE_URL=${config.supabasePgUrl || './stride.db'}`,
    ``
  );

  if (config.selfHostSupabase) {
    lines.push(
      `# Supabase (self-hosted)`,
      `SUPABASE_SERVICE_ROLE_KEY=(will be auto-generated)`,
      `JWT_SECRET=(will be auto-generated)`,
      ``
    );
  } else if (config.supabaseServiceKey) {
    lines.push(
      `# Supabase (managed)`,
      `SUPABASE_SERVICE_ROLE_KEY=${config.supabaseServiceKey}`,
      ``
    );
  }

  if (config.resendApiKey) {
    lines.push(
      `# Resend`,
      `RESEND_API_KEY=${config.resendApiKey}`,
      ``
    );
  }

  if (config.sentryDsnBackend) {
    lines.push(
      `# Sentry (backend)`,
      `SENTRY_DSN=${config.sentryDsnBackend}`,
      ``
    );
  }

  return lines.join('\n');
}

function generateDockerCompose(config: SetupConfig) {
  const services: any = {};
  const pgUrl = config.supabasePgUrl || DEFAULT_DOCKER_PG_URL;

  if (config.selfHostPowerSync) {
    services.powersync = {
      image: 'journeyapps/powersync-service:latest',
      container_name: 'stride-powersync',
      ports: ['8080:8080'],
      environment: {
        DATABASE_URL: pgUrl,
        POWERSYNC_PORT: '8080'
      },
      networks: ['stride-network'],
      healthcheck: {
        test: ['CMD', 'curl', '-f', 'http://localhost:8080/health'],
        interval: '10s',
        timeout: '5s',
        retries: 5
      }
    };
  }

  if (config.smtpService === 'mailpit') {
    services.mailpit = {
      image: 'axllent/mailpit:latest',
      container_name: 'stride-mailpit',
      ports: ['1025:1025', '8025:8025'],
      networks: ['stride-network']
    };
  }

  services['drizzle-studio'] = {
    image: 'node:24-alpine',
    container_name: 'stride-drizzle-studio',
    working_dir: '/app',
    command: 'sh -c "npm install -g drizzle-kit && drizzle-kit studio --host 0.0.0.0"',
    ports: ['4983:4983'],
    environment: {
      DATABASE_URL: pgUrl
    },
    networks: ['stride-network']
  };

  services.nginx = {
    image: 'nginx:alpine',
    container_name: 'stride-nginx',
    ports: ['80:80'],
    volumes: ['./nginx/nginx.conf:/etc/nginx/nginx.conf:ro'],
    networks: ['stride-network'],
    depends_on: Object.keys(services).filter(s => s !== 'nginx')
  };

  const compose = {
    version: '3.8',
    services,
    networks: {
      'stride-network': {
        driver: 'bridge'
      }
    }
  };

  const yamlContent = yaml.dump(compose);
  writeFileSync('docker-compose.yml', yamlContent);
  console.log(chalk.green('✓ Created docker-compose.yml'));
}

function displayServiceUrls(config: SetupConfig) {
  console.log(chalk.blue.bold('\n📍 Service URLs:\n'));

  if (config.selfHostSupabase) {
    console.log(chalk.green('  Supabase API:    ') + 'http://supabase.stride.local');
    console.log(chalk.green('  Supabase Studio: ') + 'http://studio.stride.local');
  }

  if (config.selfHostPowerSync) {
    console.log(chalk.green('  PowerSync:       ') + 'http://powersync.stride.local');
  }

  if (config.smtpService === 'mailpit') {
    console.log(chalk.green('  Mailpit UI:      ') + 'http://localhost:8025');
  }

  console.log(chalk.green('  Drizzle Studio:  ') + 'http://db.stride.local');
  console.log('');
}

main().catch((error) => {
  console.error(chalk.red('Setup failed:'), error);
  process.exit(1);
});
