#!/bin/bash
set -euo pipefail

DIST_DIR="${DIST_DIR:-dist}"
S3_BUCKET="${S3_BUCKET:-mtbmaps.net}"
CACHE_CONTROL="${CACHE_CONTROL:-max-age=604800}"
CLOUDFRONT_DISTRIBUTION_IDS="${CLOUDFRONT_DISTRIBUTION_IDS:-E1XAG5EBVMQWWB E32C96K56BB5FT}"

if [ ! -d "$DIST_DIR" ]; then
  echo "Build output directory '$DIST_DIR' does not exist."
  exit 1
fi

echo "Deploying ${DIST_DIR} to s3://${S3_BUCKET}/..."
aws s3 sync "$DIST_DIR" "s3://${S3_BUCKET}/" --cache-control "$CACHE_CONTROL" --acl public-read > /dev/null

for distribution_id in $CLOUDFRONT_DISTRIBUTION_IDS; do
  aws cloudfront create-invalidation --distribution-id "$distribution_id" --paths "/*"
done
