#!/bin/bash
set -e

echo "Removing unnecessary files from git tracking..."
git rm --cached -r artifacts/admin-panel 2>/dev/null || true
git rm --cached -r artifacts/api-server 2>/dev/null || true
git rm --cached -r artifacts/mockup-sandbox 2>/dev/null || true
git rm --cached -r lib 2>/dev/null || true
git rm --cached -r .local 2>/dev/null || true
git rm --cached pnpm-workspace.yaml 2>/dev/null || true
git rm --cached push-to-github.sh 2>/dev/null || true

echo "Updating .gitignore..."
cat > .gitignore << 'EOF'
# Unnecessary for bot deployment
artifacts/admin-panel/
artifacts/api-server/
artifacts/mockup-sandbox/
lib/
.local/
node_modules/
pnpm-workspace.yaml
push-to-github.sh

# Bot runtime files
artifacts/bot/node_modules/
artifacts/bot/session/
artifacts/bot/sessions/
artifacts/bot/downloads/
artifacts/bot/db.json
*.log
.env
EOF

echo "Setting up GitHub remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/Chathura369/MY-BOT-V2.git"

echo "Staging bot files..."
git add -A

echo "Committing..."
git commit -m "Clean bot-only deployment for Railway" --allow-empty

echo "Pushing to GitHub..."
git branch -M main
git push -u origin main --force

echo ""
echo "Done! GitHub repo now has only the bot files."
echo "Visit: https://github.com/Chathura369/MY-BOT-V2"
