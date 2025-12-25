#!/bin/bash

# Sync shared types and validation from the single source of truth to frontend and backend

SHARED_DIR="shared"
FRONTEND_DEST="frontend/src/shared"
BACKEND_DEST="backend/src/shared"

HEADER="// AUTO-GENERATED: Do not edit directly. Edit shared/ instead.
// Run 'npm run sync-types' from project root to regenerate.

"

echo "📦 Syncing shared files..."

# Ensure directories exist
mkdir -p "$FRONTEND_DEST"
mkdir -p "$BACKEND_DEST"

# Sync all TypeScript files from shared/
for file in "$SHARED_DIR"/*.ts; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo -e "$HEADER$(cat "$file")" > "$FRONTEND_DEST/$filename"
        echo -e "$HEADER$(cat "$file")" > "$BACKEND_DEST/$filename"
        echo "   ✓ $filename"
    fi
done

echo "✅ Shared files synced to:"
echo "   - $FRONTEND_DEST"
echo "   - $BACKEND_DEST"
