#!/bin/bash
# Add local domains to /etc/hosts

HOSTS_ENTRY="127.0.0.1 supabase.stride.local studio.stride.local powersync.stride.local db.stride.local"

if grep -q "stride.local" /etc/hosts; then
  echo "✓ Hosts already configured"
else
  echo "Adding local domains to /etc/hosts (requires sudo)..."
  echo "$HOSTS_ENTRY" | sudo tee -a /etc/hosts > /dev/null
  echo "✓ Hosts configured"
fi
