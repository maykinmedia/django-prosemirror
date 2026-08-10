=========
Changelog
=========

This changelog starts at 0.9.0. For earlier releases, see the git history and
the GitHub releases page.

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
