#!/bin/bash

WORKING_FOLDER=$(pwd)

if [[ "${SERVER_DIR}" != "" ]]; then
  DEST_FOLDER="${SERVER_DIR}/uploads"
else
  echo "SERVER_DIR environment variable is not set. Using ${WORKING_FOLDER} which may be incorrect"
  DEST_FOLDER="${WORKING_FOLDER}/uploads"
fi

echo "Creating upload folder at ${DEST_FOLDER}"
mkdir -p "${DEST_FOLDER}"

# Move images from sub folders to the current folder
echo "Checking for Tiff files in ${WORKING_DIR} folder"
while IFS= read -r -d '' ONE_FILE; do
  case "${ONE_FILE: -4}" in
    ".tif")
      # Look for the tif images
      FILENAME=$(basename "${ONE_FILE}")
      FILEPATH=$(dirname "${ONE_FILE}")
      if [[ "${FILEPATH}" != "${DEST_FOLDER}" ]]; then
        DEST_PATH="${DEST_FOLDER}/${FILENAME}"
        echo "Copying ${ONE_FILE} to ${DEST_PATH}"
        cp -f "${ONE_FILE}" "${DEST_PATH}"
      fi
      ;;
  esac
done < <(find "${WORKING_FOLDER}" -type f -print0)

echo "Changing to server folder and launching: ${SERVER_DIR}"

cd "${SERVER_DIR}" || echo "Changing to server folder failed"
gunicorn -w 4 -b 0.0.0.0:5000 --access-logfile '-' main:app

# Move contents of JSON folder to working folder
echo "Checking for json files in folder: ${SERVER_DIR}/json"
while IFS= read -r -d '' ONE_FILE; do
  FILENAME=$(basename "${ONE_FILE}")
  DEST_PATH="{WORKING_FOLDER}/${FILENAME}"
  echo "Copying JSON ${ONE_FILE} to ${DEST_PATH}"
  mv -f "${ONE_FILE}" "${DEST_PATH}"
done < <(find "${SERVER_DIR}/json" -type f -print0)
