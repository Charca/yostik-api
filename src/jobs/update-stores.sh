#! /bin/bash

echo "Started running crawlers\n"
echo "Remember you need to run this script from the jobs/ dir"

echo "Job: Running Amazon Crawler"
node ../stores/Amazon.js

echo "Job: Running Steam Crawler"
node ../stores/CheapShark.js steam

echo "Job: Running WinGameStore Crawler"
node ../stores/CheapShark.js wingamestore

echo "Job: Running Gog Crawler"
node ../stores/Gog.js

echo "Job: Running PlayStationStore Crawler"
node ../stores/PlayStationStore.js

echo "Finished running crawlers!"
