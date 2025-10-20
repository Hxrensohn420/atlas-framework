#!/bin/bash
# Axiom Remote Command Executor (Direct Binary Calls)
# Usage: ./axiom-remote.sh ls
#        ./axiom-remote.sh account
#        ./axiom-remote.sh select myfleet*

AXIOM_HOST="13.53.50.201"
AXIOM_USER="ubuntu"
AXIOM_DIR="/home/ubuntu/.axiom/interact"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AXIOM_KEY="$SCRIPT_DIR/keys/axiom_controller_key"

# Map commands to actual binaries
case "$1" in
  ls|list)
    BINARY="axiom-ls"
    shift
    ARGS="$*"
    ;;
  select)
    BINARY="axiom-select"
    shift
    ARGS="$*"
    ;;
  init)
    BINARY="axiom-init"
    shift
    ARGS="$*"
    ;;
  fleet)
    BINARY="axiom-fleet"
    shift
    ARGS="$*"
    ;;
  fleet2)
    BINARY="axiom-fleet2"
    shift
    ARGS="$*"
    ;;
  rm|remove)
    BINARY="axiom-rm"
    shift
    ARGS="$*"
    ;;
  exec)
    BINARY="axiom-exec"
    shift
    ARGS="$*"
    ;;
  account)
    BINARY="axiom-account"
    shift
    ARGS="$*"
    ;;
  region)
    BINARY="axiom-region"
    shift
    ARGS="$*"
    ;;
  sizes)
    BINARY="axiom-sizes"
    shift
    ARGS="$*"
    ;;
  disks)
    BINARY="axiom-disks"
    shift
    ARGS="$*"
    ;;
  images)
    BINARY="axiom-images"
    shift
    ARGS="$*"
    ;;
  ssh)
    BINARY="axiom-ssh"
    shift
    ARGS="$*"
    ;;
  scp)
    BINARY="axiom-scp"
    shift
    ARGS="$*"
    ;;
  power)
    BINARY="axiom-power"
    shift
    ARGS="$*"
    ;;
  build)
    BINARY="axiom-build"
    shift
    ARGS="$*"
    ;;
  deploy)
    BINARY="axiom-deploy"
    shift
    ARGS="$*"
    ;;
  configure)
    BINARY="axiom-configure"
    shift
    ARGS="$*"
    ;;
  *)
    echo "Unknown command: $1"
    echo "Usage: $0 {ls|select|init|fleet|rm|exec|account|region|sizes|ssh|power|...} [args]"
    exit 1
    ;;
esac

# Execute with full path
ssh -i "$AXIOM_KEY" \
    -o StrictHostKeyChecking=no \
    -o ConnectTimeout=10 \
    "$AXIOM_USER@$AXIOM_HOST" \
    "$AXIOM_DIR/$BINARY $ARGS"
