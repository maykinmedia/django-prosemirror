

Welcome to django_prosemirror's documentation!
=================================================

:Version: 0.1.0
:Source: https://github.com/maykinmedia/django_prosemirror
:Keywords: ``<keywords>``
:PythonVersion: 3.10

|build-status| |code-quality| |ruff| |coverage| |docs|

|python-versions| |django-versions| |pypi-version|

<One liner describing the project>

.. contents::

.. section-numbering::

Features
========

* ...
* ...

Installation
============

Requirements
------------

* Python 3.10 or above
* Django 4.2 or newer


Install
-------

.. code-block:: bash

    pip install django_prosemirror


Usage
=====

<document or refer to docs>

Local development
=================

To install and develop the library locally, use::

.. code-block:: bash

    pip install -e .[tests,coverage,docs,release]

When running management commands via ``django-admin``, make sure to add the root
directory to the python path (or use ``python -m django <command>``):

.. code-block:: bash

    export PYTHONPATH=. DJANGO_SETTINGS_MODULE=testapp.settings
    django-admin check
    # or other commands like:
    # django-admin makemessages -l nl


.. |build-status| image:: https://github.com/maykinmedia/django_prosemirror/workflows/Run%20CI/badge.svg
    :alt: Build status
    :target: https://github.com/maykinmedia/django_prosemirror/actions?query=workflow%3A%22Run+CI%22

.. |code-quality| image:: https://github.com/maykinmedia/django_prosemirror/workflows/Code%20quality%20checks/badge.svg
     :alt: Code quality checks
     :target: https://github.com/maykinmedia/django_prosemirror/actions?query=workflow%3A%22Code+quality+checks%22

.. |ruff| image:: https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json
    :target: https://github.com/astral-sh/ruff
    :alt: Ruff

.. |coverage| image:: https://codecov.io/gh/maykinmedia/django_prosemirror/branch/main/graph/badge.svg
    :target: https://codecov.io/gh/maykinmedia/django_prosemirror
    :alt: Coverage status

.. |docs| image:: https://readthedocs.org/projects/django_prosemirror/badge/?version=latest
    :target: https://django_prosemirror.readthedocs.io/en/latest/?badge=latest
    :alt: Documentation Status

.. |python-versions| image:: https://img.shields.io/pypi/pyversions/django_prosemirror.svg

.. |django-versions| image:: https://img.shields.io/pypi/djversions/django_prosemirror.svg

.. |pypi-version| image:: https://img.shields.io/pypi/v/django_prosemirror.svg
    :target: https://pypi.org/project/django_prosemirror/
