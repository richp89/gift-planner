#!/usr/bin/env python3
import secrets

print("\n🔐 Generate SECRET_KEY for production:\n")
print(secrets.token_urlsafe(32))
print("\n📋 Copy this value to your Railway environment variables as SECRET_KEY\n")
