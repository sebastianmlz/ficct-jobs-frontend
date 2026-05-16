#!/bin/sh
# Runtime probe: fetch index.html + every referenced same-origin asset,
# count requests + total bytes (raw and gzipped). Mirrors what the browser
# pulls on a cold first paint (no caches).
#
# Run from the host:
#   sh bench/runtime_probe.sh [before|after]
set -eu

LABEL="${1:-before}"
BASE="${BASE:-http://localhost:54200}"

INDEX=$(curl -s "$BASE/" -H 'Accept: text/html')
REFS=$(printf '%s' "$INDEX" | grep -oE '(href|src)="[^"]+"' | sed -E 's/.*"([^"]+)".*/\1/' | sort -u)

RAW_TOTAL=$(printf '%s' "$INDEX" | wc -c | tr -d ' ')
GZ_TOTAL=$(curl -sS --compressed "$BASE/" -H 'Accept-Encoding: gzip' -o /tmp/_idx.bin -w '%{size_download}\n')
COUNT=1
TOTAL_BYTES=$RAW_TOTAL
GZ_BYTES=$GZ_TOTAL

for ref in $REFS; do
  case "$ref" in
    http*|//*) continue ;;  # skip third-party (Google Fonts etc)
  esac
  url="$BASE/$(echo "$ref" | sed 's|^/||')"

  RAW=$(curl -s -o /dev/null -w '%{size_download}' "$url" || echo 0)
  GZ=$(curl -s -o /dev/null --compressed -H 'Accept-Encoding: gzip' -w '%{size_download}' "$url" || echo 0)
  # If --compressed is used and server gzips, size_download is decompressed.
  # To measure wire bytes when gzipped, use --output and check Content-Length:
  CL=$(curl -sI -H 'Accept-Encoding: gzip' "$url" | awk 'BEGIN{IGNORECASE=1} /^content-length:/ {print $2}' | tr -d '\r' | tail -1)
  WIRE="${CL:-$GZ}"

  COUNT=$(( COUNT + 1 ))
  TOTAL_BYTES=$(( TOTAL_BYTES + RAW ))
  GZ_BYTES=$(( GZ_BYTES + WIRE ))
done

OUT="bench/runtime_${LABEL}.json"
{
  printf '{\n'
  printf '  "label": "%s",\n' "$LABEL"
  printf '  "base_url": "%s",\n' "$BASE"
  printf '  "requests": %s,\n' "$COUNT"
  printf '  "total_raw_bytes": %s,\n' "$TOTAL_BYTES"
  printf '  "total_wire_bytes": %s\n' "$GZ_BYTES"
  printf '}\n'
} > "$OUT"
cat "$OUT"
