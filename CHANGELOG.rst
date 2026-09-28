=========
Changelog
=========

This changelog starts at 0.9.0. For earlier releases, see the git history and
the GitHub releases page.

0.10.0 (2026-09-28)
===================

Security-focused release that validates URL schemes on link and image
values, plus a document-repair utility for existing data and a couple of
smaller fixes.

**Security fixes**

* Reject unsafe URL schemes (e.g. ``javascript:``, ``data:``) in link
  ``href`` and ``filer_image`` ``src`` values. Previously the mark spec put
  no constraint on ``href`` and ``to_dom`` emitted the value verbatim, so a
  stored ``javascript:`` or ``data:`` URL could reach rendered HTML. An
  allow-list (``http``, ``https``, ``mailto``, ``tel``, and relative URLs) is
  now enforced in ``django_prosemirror/sanitize.py`` at three points:
  ``validate_doc`` rejects unsafe URLs on save, ``to_dom`` neutralises them
  at render time (``href`` becomes ``"#"``, ``src`` is dropped) so documents
  stored before this change still display, and ``dom_matcher`` drops the
  mark or node when parsing HTML input.
* Mirrored the same URL allow-list in the frontend ProseMirror schema
  (``frontend/utils/sanitize.ts``), so the editor itself also drops unsafe
  ``href``/``src`` values on paste and neutralises them at render time.

**New features**

* Added ``django_prosemirror.utils.process_document``, a generic recursive
  walker/rebuilder for raw ProseMirror JSON documents that lets a callback
  keep, modify, or drop any node or mark.
* Added ``sanitize_document`` and ``strip_unsafe_prosemirror_urls`` in
  ``django_prosemirror/migration_utils.py``, built on top of
  ``process_document``, giving consuming projects a ready-made repair path
  for rows stored before URL scheme validation existed, instead of
  hand-rolling a tree-walking migration.

**Bug fixes**

* Deleting all text now produces a document that is treated as empty.
  ``__bool__`` and ``doc_to_html`` check for visible content (text or atom
  nodes) instead of just checking whether ``content`` is non-empty, since
  the schema always leaves one empty paragraph behind.
* Wheel builds now include the JavaScript sourcemap, and its filename
  matches the bundled asset, so sourcemaps actually resolve.

**Maintenance**

* Configured Dependabot for GitHub Actions and applied the resulting
  updates.
* Bumped ``js-yaml`` to 4.3.2.
* Fixed the testapp to define ``MEDIA_URL``/``MEDIA_ROOT``. Without them,
  Django resolved ``MEDIA_URL`` to the script prefix, turning the media URL
  pattern into a catch-all that served every unmatched request from the
  working directory and silently disabled ``APPEND_SLASH`` redirects.
* Stopped committing the built frontend assets to the repository. CI now
  builds them fresh from a clean checkout and shares that build with the
  test and release jobs, so both run against what actually ships.
* The Vite asset-copy step now fails the build on a copy error instead of
  only logging a warning.
* Closed a zizmor cache-poisoning warning by disabling ``setup-node``'s
  automatic package-manager cache in the release build job.
* Dropped a nonexistent ``coverage`` extra from the README's dev-setup
  instructions.

0.9.0 (2026-08-10)
==================

Maintenance release that updates the supported Django and Python versions.

**Breaking changes**

* Dropped support for Django 4.2, which has reached end of life. Django 5.2 is
  now the minimum supported version.
* Raised the minimum Python version to 3.12. ``requires-python`` still allowed
  3.11, which was never part of the test matrix and which Django 6.0 and 6.1 do
  not support.
* Removed the ``DeferredScript`` class and the ``get_deferred_script`` helper
  from ``django_prosemirror.widgets``. They only existed to backport
  ``django.forms.widgets.Script``, which is available in every supported Django
  version now. The rendered ``<script>`` tag is unchanged.

**New features**

* Added support for Django 6.0 and 6.1.
* Added support for Python 3.14. The test matrix now covers Python 3.12, 3.13
  and 3.14 against Django 5.2, 6.0 and 6.1.

**Maintenance**

* Updated the npm dependencies to resolve ``npm audit`` advisories, among others
  in ``@babel/core``, ``esbuild``, ``js-yaml``, ``undici``, ``vite`` and
  ``vitest``. No runtime dependency changed, so the bundled assets are
  unaffected.
* Bumped ``postcss``.
* Pinned ``ruff`` to 0.15.0 and bumped ``zizmor`` to 0.6.2 in CI.
* The documentation build now runs in CI, with external link checking as a
  separate job (``tox -e docs-linkcheck``). The Read the Docs URL is excluded
  from the link check until that project is published.
* Corrected the project URLs in the README and documentation badges. They
  pointed at a non-existent repository and PyPI project.
