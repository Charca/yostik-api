#! /bin/bash

DIR="$(dirname "$0")"

echo "Job: Running Amazon Crawler"
node $DIR/../stores/Amazon.js

echo "Job: Running Steam Crawler"
node $DIR/../stores/CheapShark.js steam

echo "Job: Running WinGameStore Crawler"
node $DIR/../stores/CheapShark.js wingamestore

echo "Job: Running Gog Crawler"
node $DIR/../stores/Gog.js

echo "Job: Running PlayStationStore Crawler"
node $DIR/../stores/PlayStationStore.js

echo "Finished running crawlers!"
