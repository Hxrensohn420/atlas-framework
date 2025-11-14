#!/bin/bash

# === Einstellungen ===
COMPOSE_FILE="docker-compose-atlas.yml"
LOGFILE="full_rebootlog.txt"

echo "==== $(date) ====" | tee "$LOGFILE"
echo "Starte kompletten Neuaufbau des Atlas-Stacks..." | tee -a "$LOGFILE"

# === 1. Container stoppen und Volumes löschen ===
echo -e "\n--- [1/4] Container stoppen & Volumes löschen ---" | tee -a "$LOGFILE"
docker-compose -f "$COMPOSE_FILE" down -v | tee -a "$LOGFILE"

# === 2. Neu bauen ===
echo -e "\n--- [2/4] Container neu bauen ---" | tee -a "$LOGFILE"
docker-compose -f "$COMPOSE_FILE" build | tee -a "$LOGFILE"

# === 3. Neu starten (im Hintergrund) ===
echo -e "\n--- [3/4] Container starten ---" | tee -a "$LOGFILE"
docker-compose -f "$COMPOSE_FILE" up -d | tee -a "$LOGFILE"

# === 4. Logs anhängen und live anzeigen ===
echo -e "\n--- [4/4] Logs folgen ---" | tee -a "$LOGFILE"
docker-compose -f "$COMPOSE_FILE" logs -f | tee -a "$LOGFILE"


