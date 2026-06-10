#!/usr/bin/env python3
"""
Run this script to upload index.html directly to GitHub.
Requirements: pip install requests
Usage: python upload.py YOUR_GITHUB_TOKEN
"""
import sys, base64, requests, os

TOKEN = sys.argv[1] if len(sys.argv) > 1 else input("Enter GitHub token: ").strip()
OWNER = "hazzaninasili-hue"
REPO  = "talabat-liveops"
PATH  = "index.html"

# Read local file
with open(os.path.join(os.path.dirname(__file__), "index.html"), "rb") as f:
    content = f.read()

b64 = base64.b64encode(content).decode()
headers = {"Authorization": f"token {TOKEN}", "Accept": "application/vnd.github.v3+json"}

# Get current SHA
r = requests.get(f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{PATH}", headers=headers)
sha = r.json().get("sha", "") if r.status_code == 200 else ""

# Upload
payload = {"message": "Update Talabat Ops v2.1", "content": b64}
if sha:
    payload["sha"] = sha

r = requests.put(
    f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{PATH}",
    headers=headers,
    json=payload
)

if r.status_code in (200, 201):
    print("✅ Uploaded successfully!")
    print("Wait 2-3 minutes then visit: https://hazzaninasili-hue.github.io/talabat-liveops/")
else:
    print(f"❌ Failed: {r.status_code}")
    print(r.json().get("message", r.text[:200]))
