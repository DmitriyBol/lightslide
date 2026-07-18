# Security Policy

## Supported versions

The latest published `1.x` release receives security fixes. Older `0.x` pre-releases are
no longer supported — upgrade to the current release.

## Reporting a vulnerability

Please report vulnerabilities privately via
[GitHub security advisories](https://github.com/DmitriyBol/lightslide/security/advisories/new)
("Report a vulnerability" on the repository's Security tab). Do **not** open a
public issue for security reports.

You can expect an initial response within a week. Once a fix is released, the
advisory is published and credited to the reporter unless anonymity is requested.

## Scope

The published npm package (`lightslide`, the contents of `dist/`) is in scope.
The package has zero runtime dependencies beyond React and never evaluates or
injects consumer-provided strings as HTML/CSS. The `playground/` demo app and the
development tooling are not part of the published package; issues there are
welcome as regular bug reports.
