#!/usr/bin/env bash
# Works out the release tag for a commit and prints it as `tag=` / `existing=`
# lines (the GITHUB_OUTPUT format).
#
# Release tags look like v3.0.1-<suffix>.<number>, for example v3.0.1-rc.2. The
# next tag keeps everything of the newest such tag and adds one to the trailing
# number. To move to a new base version, push its first tag by hand
# (v3.0.2-<suffix>.1); later runs continue counting from there.
#
# A commit that already carries a release tag keeps it (existing=true), so a
# re-run resumes that release instead of numbering the same commit twice.
#
# Usage: next-release-tag.sh [commit]   (default: HEAD)
set -euo pipefail

commit="${1:-HEAD}"
release_tag='^v[0-9]+\.[0-9]+\.[0-9]+-[A-Za-z]+\.[0-9]+$'

newest() {
    grep -E "${release_tag}" | sort -V | tail -n 1 || true
}

tag="$(git tag --points-at "${commit}" | newest)"

if [[ -n "${tag}" ]]; then
    printf 'tag=%s\nexisting=true\n' "${tag}"
    exit 0
fi

latest="$(git tag --list 'v*' | newest)"

if [[ -z "${latest}" ]]; then
    echo "::error::No release tag such as v3.0.1-rc.1 exists yet. Push the first one by hand." >&2
    exit 1
fi

prefix="${latest%.*}"
number="${latest##*.}"

# 10# keeps a number with leading zeros from being read as octal.
printf 'tag=%s.%d\nexisting=false\n' "${prefix}" "$((10#${number} + 1))"
