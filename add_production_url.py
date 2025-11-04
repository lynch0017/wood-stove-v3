#!/usr/bin/env python3
"""
Helper script to add production API URL to .env file
Run this after deploying your backend to Railway/Render
"""
from pathlib import Path

env_path = Path(__file__).parent / '.env'

print("=" * 60)
print("Add Production API URL to .env")
print("=" * 60)
print()

if not env_path.exists():
    print("❌ .env file not found!")
    exit(1)

print("After deploying your Flask backend, you'll get a URL like:")
print("  Railway: https://wood-stove-v3-production.up.railway.app")
print("  Render:  https://wood-stove-api.onrender.com")
print()

backend_url = input("Enter your backend URL (without /api/chat): ").strip()

if not backend_url:
    print("❌ No URL provided")
    exit(1)

# Remove trailing slash if present
backend_url = backend_url.rstrip('/')

# Check if URL is valid
if not backend_url.startswith('http'):
    print("❌ URL must start with http:// or https://")
    exit(1)

# Read current .env
with open(env_path, 'r') as f:
    lines = f.readlines()

# Check if VITE_API_URL already exists
has_api_url = any('VITE_API_URL' in line for line in lines)

if has_api_url:
    print()
    print("⚠️  VITE_API_URL already exists in .env file")
    replace = input("Do you want to replace it? (y/n): ").strip().lower()
    
    if replace != 'y':
        print("Cancelled.")
        exit(0)
    
    # Replace existing line
    new_lines = []
    for line in lines:
        if 'VITE_API_URL' in line and not line.strip().startswith('#'):
            new_lines.append(f"VITE_API_URL={backend_url}\n")
        else:
            new_lines.append(line)
    
    with open(env_path, 'w') as f:
        f.writelines(new_lines)
    
    print()
    print("✅ Updated VITE_API_URL in .env file")
else:
    # Add new line
    with open(env_path, 'a') as f:
        f.write(f"\n# Production Backend API URL\n")
        f.write(f"VITE_API_URL={backend_url}\n")
    
    print()
    print("✅ Added VITE_API_URL to .env file")

print()
print("=" * 60)
print("Next Steps:")
print("=" * 60)
print("1. Test locally: npm run dev")
print("2. Build for production: npm run build")
print("3. Deploy to GitHub Pages: git push")
print()
print(f"Your chat will now connect to: {backend_url}/api/chat")
print("=" * 60)

