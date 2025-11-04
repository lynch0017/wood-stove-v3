#!/usr/bin/env python3
"""
Helper script to add VITE_ prefixed environment variables to .env file
This reads your existing InfluxDB variables and adds VITE_ versions for React
"""
from pathlib import Path
from dotenv import load_dotenv
import os

env_path = Path(__file__).parent / '.env'

if not env_path.exists():
    print("❌ .env file not found!")
    exit(1)

# Load existing env vars
load_dotenv(env_path)

# Read the current .env file
with open(env_path, 'r') as f:
    lines = f.readlines()

# Check if VITE_ variables already exist
has_vite_vars = any('VITE_INFLUXDB' in line for line in lines)

if has_vite_vars:
    print("✓ VITE_ variables already exist in .env file")
    print("\nCurrent VITE_ variables:")
    for line in lines:
        if 'VITE_' in line and not line.strip().startswith('#'):
            print(f"  {line.strip()}")
    exit(0)

# Get the current values
influx_vars = {
    'INFLUXDB_URL': os.getenv('INFLUXDB_URL'),
    'INFLUXDB_TOKEN': os.getenv('INFLUXDB_TOKEN'),
    'INFLUXDB_ORG': os.getenv('INFLUXDB_ORG'),
    'INFLUXDB_BUCKET': os.getenv('INFLUXDB_BUCKET')
}

# Check if all variables exist
missing = [k for k, v in influx_vars.items() if not v]
if missing:
    print(f"❌ Missing variables: {', '.join(missing)}")
    exit(1)

# Add VITE_ prefixed variables
print("Adding VITE_ prefixed variables to .env file...\n")

with open(env_path, 'a') as f:
    f.write("\n# React/Vite Frontend Variables (added automatically)\n")
    for key, value in influx_vars.items():
        vite_key = f"VITE_{key}"
        f.write(f"{vite_key}={value}\n")
        print(f"✓ Added {vite_key}")

print("\n✅ Successfully added VITE_ variables!")
print("\n⚠️  IMPORTANT: You must RESTART your React dev server for changes to take effect:")
print("   1. Stop the dev server (Ctrl+C)")
print("   2. Run: npm run dev")
print("   3. Refresh your browser")

