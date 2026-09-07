# Publish & deployment process for the PaSO specifications site.
#
# Versioned docs are managed with mike on the gh-pages branch and served
# via GitHub Pages. All tools run through uv (uvx) — no local installs needed.
#
# Typical flow:
#   make serve            # live-preview while editing
#   make deploy           # build current branch's docs into gh-pages (local only)
#   make publish          # deploy + push gh-pages (updates the live site)
#   make release          # publish AND point the 'latest' alias at this version

UVX     := uvx --with mkdocs-material
MIKE    := $(UVX) mike
MKDOCS  := $(UVX) mkdocs

# Docs version = current git branch (e.g. draft-2). Override: make publish VERSION=draft-3
VERSION ?= $(shell git rev-parse --abbrev-ref HEAD)
ALIAS   ?= latest

.PHONY: help serve build deploy publish release list versions-serve delete clean check-clean

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  \033[1m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  VERSION=$(VERSION)  ALIAS=$(ALIAS)  (override: make publish VERSION=draft-3)"

serve: ## Live-preview the docs locally (single version, no mike)
	$(MKDOCS) serve

build: ## Strict one-off build into ./site (CI-style sanity check)
	$(MKDOCS) build --strict

check-clean: ## Fail if the working tree has uncommitted changes
	@git diff --quiet && git diff --cached --quiet || \
		{ echo "error: working tree is dirty — commit your changes first"; exit 1; }

deploy: check-clean ## Build $(VERSION) into the local gh-pages branch (no push)
	$(MIKE) deploy $(VERSION)
	@echo "Deployed $(VERSION) to local gh-pages. Run 'make publish' to go live."

publish: check-clean ## Deploy $(VERSION) and push gh-pages (updates the live site)
	$(MIKE) deploy --push $(VERSION)

release: check-clean ## Deploy $(VERSION), point '$(ALIAS)' at it, and push
	$(MIKE) deploy --push --update-aliases $(VERSION) $(ALIAS)

list: ## List versions known to mike (local gh-pages)
	$(MIKE) list

versions-serve: ## Preview the full versioned site from local gh-pages
	$(MIKE) serve

delete: ## Delete a version from gh-pages and push (make delete VERSION=draft-1)
	$(MIKE) delete --push $(VERSION)

clean: ## Remove the local ./site build directory
	rm -rf site

.DEFAULT_GOAL := help