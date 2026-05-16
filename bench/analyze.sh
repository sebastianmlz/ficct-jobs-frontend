#!/bin/sh
# Bundle analyzer — runs inside the builder container (Alpine BusyBox).
#
# Usage:
#   docker compose -f bench/docker-compose.bench.yml exec builder sh bench/analyze.sh [before|after]
set -eu

LABEL="${1:-before}"
DIST_BROWSER="dist/ficct-jobs-frontend/browser"

if [ ! -d "$DIST_BROWSER" ]; then
  echo "ERROR: $DIST_BROWSER does not exist. Run 'sh bench/build.sh' first." >&2
  exit 1
fi

# Portable file-size helper for Alpine BusyBox.
size_of() {
  wc -c < "$1" | tr -d ' '
}

cd "$DIST_BROWSER"

# Total bundle size (every file served).
TOTAL_BYTES=0
for f in $(find . -type f); do
  TOTAL_BYTES=$(( TOTAL_BYTES + $(size_of "$f") ))
done

# Per-type totals.
JS_BYTES=0
for f in $(find . -type f -name '*.js'); do
  JS_BYTES=$(( JS_BYTES + $(size_of "$f") ))
done
CSS_BYTES=0
for f in $(find . -type f -name '*.css'); do
  CSS_BYTES=$(( CSS_BYTES + $(size_of "$f") ))
done

# Initial payload (everything index.html references locally + index.html
# itself). Lazy chunks are NOT in here because they aren't referenced
# from index.html — they're imported by main on demand.
INITIAL_REFS=$(grep -oE '(href|src)="[^"]+"' index.html | sed -E 's/.*"([^"]+)".*/\1/' | sort -u)
INITIAL_BYTES=$(size_of index.html)
INITIAL_COUNT=1  # index.html itself
for ref in $INITIAL_REFS; do
  local_path=$(echo "$ref" | sed 's|^/||')
  case "$local_path" in
    http*|//*) continue ;;
  esac
  if [ -f "$local_path" ]; then
    INITIAL_BYTES=$(( INITIAL_BYTES + $(size_of "$local_path") ))
    INITIAL_COUNT=$(( INITIAL_COUNT + 1 ))
  fi
done

# Largest single file.
LARGEST_SIZE=0
LARGEST_PATH=""
for f in $(find . -type f); do
  sz=$(size_of "$f")
  if [ "$sz" -gt "$LARGEST_SIZE" ]; then
    LARGEST_SIZE=$sz
    LARGEST_PATH=$f
  fi
done

# Top 10 chunks (by size).
TOP_TEN_LINES=$(
  for f in $(find . -type f); do
    printf '%s %s\n' "$(size_of "$f")" "$f"
  done | sort -nr | head -10
)
TOP_TEN_JSON=""
while IFS= read -r line; do
  sz=$(echo "$line" | awk '{print $1}')
  path=$(echo "$line" | awk '{$1=""; sub(/^ /,""); print}')
  TOP_TEN_JSON="${TOP_TEN_JSON}    {\"bytes\": ${sz}, \"path\": \"${path}\"},\n"
done <<EOF
$TOP_TEN_LINES
EOF
# strip trailing comma+newline
TOP_TEN_JSON=$(printf '%b' "$TOP_TEN_JSON" | sed '$ s/,$//')

# Gzipped total (what nginx with gzip on would actually send).
TMP=$(mktemp -d)
GZ_TOTAL=0
for f in $(find . -type f \( -name '*.js' -o -name '*.css' -o -name '*.svg' -o -name '*.html' -o -name '*.json' \)); do
  gzip -9 -c "$f" > "$TMP/out.gz"
  GZ_TOTAL=$(( GZ_TOTAL + $(size_of "$TMP/out.gz") ))
done
rm -rf "$TMP"

# Gzipped initial payload — most relevant for "first paint" wire bytes.
TMP=$(mktemp -d)
GZ_INITIAL=0
gzip -9 -c index.html > "$TMP/out.gz"
GZ_INITIAL=$(( GZ_INITIAL + $(size_of "$TMP/out.gz") ))
for ref in $INITIAL_REFS; do
  local_path=$(echo "$ref" | sed 's|^/||')
  case "$local_path" in
    http*|//*) continue ;;
  esac
  if [ -f "$local_path" ]; then
    gzip -9 -c "$local_path" > "$TMP/out.gz"
    GZ_INITIAL=$(( GZ_INITIAL + $(size_of "$TMP/out.gz") ))
  fi
done
rm -rf "$TMP"

cd - >/dev/null

OUT="bench/results_${LABEL}.json"
{
  printf '{\n'
  printf '  "label": "%s",\n' "$LABEL"
  printf '  "total_bytes": %s,\n' "$TOTAL_BYTES"
  printf '  "js_total_bytes": %s,\n' "$JS_BYTES"
  printf '  "css_total_bytes": %s,\n' "$CSS_BYTES"
  printf '  "gzipped_compressible_bytes": %s,\n' "$GZ_TOTAL"
  printf '  "initial_request_count": %s,\n' "$INITIAL_COUNT"
  printf '  "initial_payload_bytes": %s,\n' "$INITIAL_BYTES"
  printf '  "initial_payload_gz_bytes": %s,\n' "$GZ_INITIAL"
  printf '  "largest_chunk_bytes": %s,\n' "$LARGEST_SIZE"
  printf '  "largest_chunk_path": "%s",\n' "$LARGEST_PATH"
  printf '  "top_10": [\n%s\n  ]\n' "$TOP_TEN_JSON"
  printf '}\n'
} > "$OUT"

cat "$OUT"
echo
echo "Wrote $OUT"
