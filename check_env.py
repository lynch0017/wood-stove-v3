#!/usr/bin/env python3
"""
Helper script to check .env file format without exposing sensitive values
"""
from pathlib import Path
from dotenv import load_dotenv
import os

env_path = Path(__file__).parent / '.env'

if not env_path.exists():
    print("❌ .env file not found!")
    exit(1)

print(f"✓ Found .env file at: {env_path}\n")

# Read the file to check format
with open(env_path, 'r') as f:
    lines = f.readlines()

print("Checking .env file format:\n")
print("-" * 50)

required_vars = ['OPENAI_API_KEY', 'INFLUXDB_URL', 'INFLUXDB_TOKEN', 'INFLUXDB_ORG', 'INFLUXDB_BUCKET']

for i, line in enumerate(lines, 1):
    line = line.strip()
    if not line or line.startswith('#'):
        continue
    
    if '=' in line:
        key = line.split('=')[0].strip()
        has_value = len(line.split('=', 1)[1].strip()) > 0
        status = "✓" if has_value else "❌ (empty)"
        
        # Check if it's a required variable
        if key in required_vars:
            print(f"Line {i}: {status} {key}={'*' * 10 if has_value else '(no value)'}")
        else:
            print(f"Line {i}: {status} {key}={'*' * 10 if has_value else '(no value)'}")
    else:
        print(f"Line {i}: ⚠ Invalid format (no '=' found)")

print("-" * 50)

# Now load and check what dotenv sees
load_dotenv(env_path)

print("\nChecking loaded environment variables:\n")
for var in required_vars:
    value = os.getenv(var)
    if value:
        print(f"✓ {var} = {'*' * 10} (loaded successfully)")
    else:
        print(f"❌ {var} = (not found)")

print("\n" + "=" * 50)
print("If a variable shows in the file but not as loaded,")
print("check for:")
print("  - Extra spaces around the = sign")
print("  - Quotes that shouldn't be there")
print("  - Comments (#) at the start of the line")
print("=" * 50)

