# Payments and SCA for OpenID

Specifications and rulebooks for **Payments and Strong Customer Authentication (SCA) for OpenID** ("PaSO"),
published by the [APTITUDE Consortium](https://github.com/APTITUDE-Consortium).

The documentation is written in Markdown and built as a static site with
[MkDocs](https://www.mkdocs.org/) using the
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) theme.
Published site: <https://aptitude-consortium.github.io/payments-and-sca-for-openid/>

## Repository layout

```text
docs/
  index.md                     # landing page
  specifications/              # PaSO Core, View, Proof specs
  rulebooks/transaction_data/  # Generic, Mandate, Payment rulebooks
  assets/                      # logo and other static assets
mkdocs.yml                     # site + theme configuration
```

There is no explicit `nav:` in `mkdocs.yml` — the navigation is generated
automatically from the directory structure under `docs/`.

## Prerequisites

- Python 3.11+ (this checkout was created with Python 3.14)
- `git` (required by `mike`, see [Versioning](#versioning-with-mike))

## Setup

Create a virtual environment and install the toolchain:

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

pip install mkdocs mkdocs-material mike
```

Versions currently in use:

| Package               | Version |
| --------------------- | ------- |
| `mkdocs`              | 1.6.1   |
| `mkdocs-material`     | 9.7.7   |
| `mike`                | 2.2.0   |
| `pymdown-extensions`  | 11.0.2  |

> `pymdown-extensions` and `mkdocs-material-extensions` are pulled in as
> dependencies of `mkdocs-material`; no separate install is needed.

## Building the documentation

### Live preview

```bash
mkdocs serve
```

Serves the docs at <http://127.0.0.1:8000> with hot reload on file changes.
This is the command you want while writing.

### Static build

```bash
mkdocs build
```

Renders the site into `site/` (git-ignored).

Add `--strict` to turn warnings — e.g. broken internal links — into build
failures:

```bash
mkdocs build --strict
```

> **Heads up:** `--strict` currently **aborts with 11 warnings**. The rulebooks
> under `docs/rulebooks/transaction_data/` link to `../../specs/…`, but the
> directory is actually named `specifications/`. Plain `mkdocs build` succeeds
> and simply leaves those links dead. Fixing the paths (`specs/` →
> `specifications/`) would make the build strict-clean and is a prerequisite for
> enforcing `--strict` in CI.

## Versioning with `mike`

The site is **version-aware**. `mkdocs.yml` enables the Material version
selector and wires it to [`mike`](https://github.com/jimporter/mike):

```yaml
extra:
  version:
    provider: mike
    default: stable
```

See the Material guide on
[setting up versioning](https://squidfunk.github.io/mkdocs-material/setup/setting-up-versioning/)
for the full background.

### How it works

`mike` builds the docs and commits the result into the **`gh-pages`** branch,
one subdirectory per version, plus a `versions.json` manifest that feeds the
version dropdown in the site header. GitHub Pages serves that branch.

Because `mike` writes to a git branch, always run it from a clean working tree
and never edit `gh-pages` by hand.

### Current state

```bash
mike list
```

At the time of writing `gh-pages` contains a single version, `draft-1`, with no
aliases. Note that `mkdocs.yml` sets `default: stable`, so a `stable` alias
should be assigned (see below) for the root URL redirect to resolve.

### Common commands

Deploy (or re-deploy) a version and push it to the remote:

```bash
mike deploy --push --update-aliases 1.0 latest
```

- `1.0` — the version identifier, becomes the URL path segment
- `latest` — an alias pointing at that version; `--update-aliases` moves an
  existing alias to the new version

Set the version that `/` redirects to — this must match `extra.version.default`
in `mkdocs.yml`:

```bash
mike set-default --push stable
```

Other useful operations:

```bash
mike list                  # list deployed versions and aliases
mike serve                 # preview the whole versioned site locally
mike delete --push 0.9     # remove a version
```

### Local preview of versions

`mike serve` renders the versioned site (including the dropdown) from the
`gh-pages` branch. For day-to-day editing prefer `mkdocs serve`, which builds
the working tree directly and is much faster.

## Publishing

There is currently **no CI workflow** in this repository — publishing is a
manual step. After merging documentation changes:

```bash
mike deploy --push --update-aliases <version> stable
```

## Notes

- `site/` and `.venv/` are git-ignored; only Markdown sources and `mkdocs.yml`
  are versioned on the content branches.
- Mermaid diagrams are supported via the `pymdownx.superfences` custom fence —
  use ```` ```mermaid ```` code blocks.
- `mkdocs.yml` declares `pymdownx.superfences` twice; the second entry (the one
  carrying `custom_fences`) wins. The duplicate is harmless but can be removed.
- There is no pinned dependency file (`requirements.txt` / `pyproject.toml`).
  Adding one would make builds reproducible across machines and CI.

## License

See [LICENSE.txt](LICENSE.txt).
