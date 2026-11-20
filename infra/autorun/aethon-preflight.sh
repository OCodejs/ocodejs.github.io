#!/usr/bin/env bash
# OCodeJS AETHON preflight — read-only diagnostics.
# Does not install packages, modify configuration, open ports, or print secrets.
set -u
section() { printf '\n== %s ==\n' "$1"; }
section "Host"
printf 'hostname=%s\n' "$(hostname 2>/dev/null || echo unknown)"
printf 'os='
if [ -r /etc/os-release ]; then . /etc/os-release; printf '%s %s\n' "${PRETTY_NAME:-unknown}" "${VERSION_ID:-}"; else uname -srm; fi
printf 'kernel=%s\n' "$(uname -r 2>/dev/null || echo unknown)"
printf 'arch=%s\n' "$(uname -m 2>/dev/null || echo unknown)"
section "CPU and memory"
printf 'cpu_threads=%s\n' "$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo unknown)"
if command -v free >/dev/null 2>&1; then free -h | awk '/^Mem:/ {print "memory_total="$2; print "memory_available="$7}'; else echo "memory=free-command-unavailable"; fi
section "Disk"
df -hP / 2>/dev/null | awk 'NR==1 {print "filesystem="$1,"size="$2,"used="$3,"available="$4,"use="$5} NR==2 {print "root="$0}'
section "Container runtime"
if command -v docker >/dev/null 2>&1; then
  docker --version 2>&1
  if docker info >/dev/null 2>&1; then
    echo "docker_daemon=accessible"
    docker info --format 'docker_server={{.ServerVersion}} storage_driver={{.Driver}} cgroup={{.CgroupVersion}}' 2>/dev/null || true
  else
    echo "docker_daemon=not-accessible-for-current-user"
  fi
else
  echo "docker=not-installed"
fi
if command -v podman >/dev/null 2>&1; then podman --version 2>&1; else echo "podman=not-installed"; fi
section "Networking and ports"
for port in 22 3000 2222 5432 8080 8443; do
  if command -v ss >/dev/null 2>&1 && ss -lnt 2>/dev/null | awk '{print $4}' | grep -Eq "[:.]$port$"; then
    printf 'tcp_%s=listening\n' "$port"
  else
    printf 'tcp_%s=not-listening-or-unavailable\n' "$port"
  fi
done
if command -v curl >/dev/null 2>&1; then
  printf 'https_egress='
  curl -IsS --max-time 5 https://codeberg.org/ 2>/dev/null | head -n 1 || echo "unavailable"
else
  echo "https_egress=curl-unavailable"
fi
section "System limits"
printf 'ulimit_nofile=%s\n' "$(ulimit -n 2>/dev/null || echo unknown)"
printf 'cgroup_memory_limit='
if [ -r /sys/fs/cgroup/memory.max ]; then cat /sys/fs/cgroup/memory.max; elif [ -r /sys/fs/cgroup/memory/memory.limit_in_bytes ]; then cat /sys/fs/cgroup/memory/memory.limit_in_bytes; else echo unknown; fi
section "Result"
echo "READ_ONLY_PREFLIGHT_COMPLETE"
echo "Review output before installing Forgejo or enrolling a runner."
