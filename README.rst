

django-prosemirror
==================

:Version: 0.8.0
:Source: https://github.com/maykinmedia/django_prosemirror
:Keywords: Django, Prosemirror, rich-text, editor, document, JSON, WYSIWYG, content editor, text editor, markdown, html
:PythonVersion: 3.11+

|build-status| |code-quality| |ruff| |coverage| |docs|

|python-versions| |django-versions| |pypi-version|

Rich-text fields for Django using `Prosemirror <https://prosemirror.net/>`_ -
a powerful, schema-driven rich text editor.

.. contents::

.. section-numbering::

Features
========

* **Rich-text editing**: Full-featured Prosemirror editor integration with Django
  (admin) forms
* **Bidirectional conversion**: Seamless conversion between HTML and ProseMirror
  document format
* **Configurable schemas**: Fine-grained control over allowed content (headings, links,
  images, tables, etc.)
* **Native ProseMirror storage**: Documents are stored in their native Prosemirror
  format, preserving structure and enabling programmatic manipulation without HTML parsing

Installation
============

Requirements
------------

* Python 3.11 or above
* Django 4.2 or newer

Install
-------

.. code-block:: bash

    pip install maykin-django-prosemirror

Add to your Django settings:

.. code-block:: python

    INSTALLED_APPS = [
        # ... your other apps
        'django_prosemirror',
    ]

Usage
=====

Model Field
-----------

Use ``ProseMirrorModelField`` in your Django models:

.. code-block:: python

    from django.db import models
    from django_prosemirror.fields import ProseMirrorModelField
    from django_prosemirror.schema import NodeType, MarkType

    class BlogPost(models.Model):
        title = models.CharField(max_length=200)

        # Full-featured rich text content (uses default configuration allowing all node
        # and mark types)
        content = ProseMirrorModelField()

        # Limited schema - only headings and paragraphs with bold text
        summary = ProseMirrorModelField(
            allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING],
            allowed_mark_types=[MarkType.STRONG],
            null=True,
            blank=True
        )

        # Default document
        content_with_prompt = ProseMirrorModelField(
            default=lambda: {
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": "Start writing..."}]
                    }
                ]
            }
        )

Accessing Content
-----------------

Accessing a field returns a ``ProsemirrorFieldDocument``. It holds the raw
ProseMirror document structure and lets you read the content as HTML or as the
underlying document dict:

.. code-block:: python

    post = BlogPost.objects.get(pk=1)

    post.content.html  # "<h1>Heading</h1><p>Paragraph content...</p>"
    post.content.doc   # {"type": "doc", "content": [...]}

Use ``safe_html`` to render content in templates — Django's auto-escaping
means ``html`` would print the tags as literal text:

.. code-block:: html

    {{ post.content.safe_html }}

Setting field values
--------------------

Fields accept a ProseMirror document dict, an HTML string, ``None`` (nullable
fields only), or a ``ProsemirrorFieldDocument``. Any other type raises a
``ValidationError``.

.. code-block:: python

    # Dict — the native ProseMirror document format
    Article.objects.create(content={
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "My Heading"}]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Some "},
                    {"type": "text", "marks": [{"type": "strong"}], "text": "bold"},
                    {"type": "text", "text": " text."}
                ]
            }
        ]
    })

    # HTML string — converted to a doc automatically using the field's schema
    Article.objects.create(content="<h1>My Heading</h1><p>Some <strong>bold</strong> text.</p>")

    # Plain text (no tags) is also accepted — wrapped in a paragraph
    Article.objects.create(content="Just plain text")

    # Direct assignment on an existing instance works the same way
    article = Article.objects.get(pk=1)
    article.content = "<p>Replaced via HTML</p>"
    article.save()

    # Unsupported types raise ValidationError
    article.content = ["not", "valid"]  # raises ValidationError

Regardless of input type, reading the field always returns a
``ProsemirrorFieldDocument``:

.. code-block:: python

    article = Article.objects.get(pk=1)
    article.content.html  # "<h1>My Heading</h1><p>Some <strong>bold</strong> text.</p>"
    article.content.doc   # {"type": "doc", "content": [...]}

If you already hold a reference to the ``ProsemirrorFieldDocument`` object
(e.g. it was passed into a function), you can mutate it in place via the
``.html`` or ``.doc`` setters — the change is synced back to the model
automatically:

.. code-block:: python

    def update_content(doc, new_html):
        doc.html = new_html  # syncs back to the model instance

    update_content(post.content, "<p>Updated</p>")
    post.save()

``ProsemirrorFieldDocument`` is falsy when the document is ``None`` or its
``content`` list is empty, and truthy otherwise:

.. code-block:: python

    if post.content:
        render(post.content.safe_html)

.. note::
   An empty paragraph (``<p></p>``) is truthy — it is a content node even
   though it contains no text. Only a completely empty document
   (``{"type": "doc", "content": []}``) is falsy.

Two convenience methods are also available for clearing the content:

.. code-block:: python

    post.content.clear()    # reset to an empty document
    post.content.nullify()  # set to None (field must allow null)

Both update the in-memory model instance only — you must call ``post.save()``
to persist the change to the database.

Form Field
----------

Use ``ProsemirrorFormField`` in Django forms:

.. code-block:: python

    from django import forms
    from django_prosemirror.fields import ProsemirrorFormField
    from django_prosemirror.schema import NodeType, MarkType

    class BlogPostForm(forms.Form):
        title = forms.CharField(max_length=200)

        # Full-featured editor (uses default configuration)
        content = ProsemirrorFormField()

        # Limited to headings and paragraphs with basic formatting
        summary = ProsemirrorFormField(
            allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING],
            allowed_mark_types=[MarkType.STRONG, MarkType.ITALIC],
            required=False
        )

Schema Configuration
--------------------

Control exactly what content types are allowed using node and mark types:

.. important::
   You must always include ``NodeType.PARAGRAPH`` in your ``allowed_node_types`` list.
   The field will raise a ``ValueError`` if omitted.

.. code-block:: python

    from django_prosemirror.schema import NodeType, MarkType

    # Available node types
    NodeType.PARAGRAPH         # Paragraphs (required)
    NodeType.HEADING           # Headings (h1-h6)
    NodeType.BLOCKQUOTE        # Quote blocks
    NodeType.HORIZONTAL_RULE   # Horizontal rules
    NodeType.CODE_BLOCK        # Code blocks
    NodeType.FILER_IMAGE       # Images (requires django-filer)
    NodeType.HARD_BREAK        # Line breaks
    NodeType.BULLET_LIST       # Bullet lists
    NodeType.ORDERED_LIST      # Numbered lists
    NodeType.LIST_ITEM         # List items
    NodeType.TABLE             # Tables
    NodeType.TABLE_ROW         # Table rows
    NodeType.TABLE_CELL        # Table data cells
    NodeType.TABLE_HEADER      # Table header cells

    # Available mark types
    MarkType.STRONG            # Bold text
    MarkType.ITALIC            # Italic text (em)
    MarkType.UNDERLINE         # Underlined text
    MarkType.STRIKETHROUGH     # Strikethrough text
    MarkType.CODE              # Inline code
    MarkType.LINK              # Links

    # Custom configurations
    BASIC_FORMATTING = {
        'allowed_node_types': [NodeType.PARAGRAPH, NodeType.HEADING],
        'allowed_mark_types': [MarkType.STRONG, MarkType.ITALIC, MarkType.LINK],
    }

    BLOG_EDITOR = {
        'allowed_node_types': [
            NodeType.PARAGRAPH,
            NodeType.HEADING,
            NodeType.BLOCKQUOTE,
            NodeType.IMAGE,
            NodeType.BULLET_LIST,
            NodeType.ORDERED_LIST,
            NodeType.LIST_ITEM,
        ],
        'allowed_mark_types': [
            MarkType.STRONG,
            MarkType.ITALIC,
            MarkType.LINK,
            MarkType.CODE,
        ],
    }

    TABLE_EDITOR = {
        'allowed_node_types': [
            NodeType.PARAGRAPH,
            NodeType.HEADING,
            NodeType.TABLE,
            NodeType.TABLE_ROW,
            NodeType.TABLE_CELL,
            NodeType.TABLE_HEADER,
        ],
        'allowed_mark_types': [MarkType.STRONG, MarkType.ITALIC],
    }

    # Use in fields
    class DocumentModel(models.Model):
        blog_content = ProseMirrorModelField(**BLOG_EDITOR)
        table_content = ProseMirrorModelField(**TABLE_EDITOR)

Default Values
--------------

Always use callables for default values returning valid ProseMirror documents:

.. code-block:: python

    from django_prosemirror.constants import get_empty_doc

    class Article(models.Model):
        # ✅ Correct: Using a callable
        content = ProseMirrorModelField(default=get_empty_doc)

        # ❌ Wrong: Static dict (validation error)
        # content = ProseMirrorModelField(
        #     default={"type": "doc", "content": []}
        # )

Django Admin Integration
------------------------

The field works automatically with Django admin:

.. code-block:: python

    from django.contrib import admin
    from .models import BlogPost

    @admin.register(BlogPost)
    class BlogPostAdmin(admin.ModelAdmin):
        fields = ['title', 'content', 'summary']
        readonly_fields = ['summary']  # Read-only fields render as HTML

        # Editable fields: Render the full ProseMirror rich-text editor
        # Read-only fields: Render as formatted HTML output


Frontend Integration
--------------------

**Required Assets**: The ProseMirror form fields require both CSS and JavaScript assets to function. These assets are **mandatory** for any template that renders ProseMirror form fields - without them, the rich text editor will not work.

.. code-block:: html

    {% load django_prosemirror %}
    <!DOCTYPE html>
    <html>
    <head>
        {% include_django_prosemirror_css %}
        {% include_django_prosemirror_js_defer %}
    </head>
    <body>
        {{ form.as_p }}
    </body>
    </html>

**Note**: These assets are only required for form rendering (editing). Displaying saved content using ``{{ post.content.html }}`` in templates does not require these assets.

Data migrations
===============

Corrupt ProseMirror field data can end up in the database whenever code
bypasses the field's validation — for example, a ``bulk_create`` or
``update()`` call that writes raw values directly, a third-party library
that writes to the column without going through the descriptor, or a data
import that predates the field being introduced. ``django_prosemirror``
provides helpers in ``django_prosemirror.migration_utils`` to audit and
repair affected rows safely. All helpers bypass the field descriptor via
``.values()`` and ``.update()``, so they work even when corrupt rows would
otherwise raise ``ValidationError`` on normal access.

Auditing
--------

Use the ``iter_*`` functions to inspect data without modifying it:

.. code-block:: python

    from django_prosemirror.migration_utils import (
        iter_corrupt_prosemirror_rows,
        iter_schema_invalid_prosemirror_rows,
    )

    # Wrong type or shape (strings, lists, numbers, malformed dicts)
    for pk, raw in iter_corrupt_prosemirror_rows(MyModel, "body"):
        print(f"pk={pk}: corrupt value {raw!r}")

    # Correct shape but fails schema validation for that field
    for pk, raw in iter_schema_invalid_prosemirror_rows(MyModel, "body"):
        print(f"pk={pk}: schema-invalid doc {raw!r}")

These two functions cover disjoint sets: a row will appear in at most one of
them.

Repairing
---------

Three repair functions are available, each returning a ``list[RepairRecord]``
for logging:

.. code-block:: python

    from django_prosemirror.migration_utils import (
        repair_prosemirror_html_strings,
        nullify_corrupt_prosemirror_rows,
        clear_corrupt_prosemirror_rows,
    )

    # Convert corrupt HTML strings to proper doc dicts
    records = repair_prosemirror_html_strings(MyModel, "body")

    # Set corrupt values to NULL (nullable fields only — raises ValueError otherwise)
    records = nullify_corrupt_prosemirror_rows(MyModel, "body")

    # Set corrupt values to an empty doc (works on any field)
    records = clear_corrupt_prosemirror_rows(MyModel, "body")

    for r in records:
        print(f"pk={r.pk}: {r.original!r} → {r.repaired!r}")

Example data migration
----------------------

A common case is a field that previously stored raw HTML strings. Use
``repair_prosemirror_html_strings`` to convert them in place:

.. code-block:: python

    from django_prosemirror.migration_utils import repair_prosemirror_html_strings

    def migrate(apps, schema_editor):
        MyModel = apps.get_model("myapp", "MyModel")
        records = repair_prosemirror_html_strings(MyModel, "body")
        for r in records:
            print(f"Repaired pk={r.pk}")
        print(f"{len(records)} row(s) repaired")

    class Migration(migrations.Migration):
        dependencies = [("myapp", "0001_initial")]
        operations = [migrations.RunPython(migrate, migrations.RunPython.noop)]

The schema used for conversion is derived automatically from the field
definition on the historical model, so no manual schema configuration is
needed.

For non-string corrupt values (integers, lists, malformed dicts) there is no
automatic conversion. If you know what shape the corrupt data takes you can
fix it yourself using ``iter_corrupt_prosemirror_rows``:

.. code-block:: python

    from django_prosemirror.migration_utils import iter_corrupt_prosemirror_rows

    def migrate(apps, schema_editor):
        MyModel = apps.get_model("myapp", "MyModel")
        for pk, raw in iter_corrupt_prosemirror_rows(MyModel, "body"):
            fixed = my_conversion(raw)  # your own logic here
            MyModel.objects.filter(pk=pk).update(body=fixed)

    class Migration(migrations.Migration):
        dependencies = [("myapp", "0001_initial")]
        operations = [migrations.RunPython(migrate, migrations.RunPython.noop)]

If the values are genuinely unrecoverable, fall back to
``clear_corrupt_prosemirror_rows`` to reset them to an empty document, or
``nullify_corrupt_prosemirror_rows`` if the field allows null:

.. code-block:: python

    from django_prosemirror.migration_utils import (
        clear_corrupt_prosemirror_rows,
        nullify_corrupt_prosemirror_rows,
    )

    def migrate(apps, schema_editor):
        MyModel = apps.get_model("myapp", "MyModel")
        # For non-nullable fields
        clear_corrupt_prosemirror_rows(MyModel, "body")
        # For nullable fields
        nullify_corrupt_prosemirror_rows(MyModel, "summary")

    class Migration(migrations.Migration):
        dependencies = [("myapp", "0001_initial")]
        operations = [migrations.RunPython(migrate, migrations.RunPython.noop)]


Local development
=================

Requirements for development:

* Node.js (for building frontend assets)
* All runtime requirements listed above

Setup for development:

.. code-block:: bash

    python -mvirtualenv .venv
    source .venv/bin/activate

    # Install Python package in development mode
    pip install -e .[tests,coverage,docs,release]

    # Install Node.js dependencies
    npm install

    # Build frontend assets (when making changes to JavaScript)
    ./build.sh

When running management commands via ``django-admin``, make sure to add the root
directory to the python path (or use ``python -m django <command>``):

.. code-block:: bash

    export PYTHONPATH=. DJANGO_SETTINGS_MODULE=testapp.settings
    django-admin migrate
    django-admin createsuperuser  # optional
    django-admin runserver


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

.. |python-versions| image:: https://img.shields.io/pypi/pyversions/maykin-django-prosemirror.svg

.. |django-versions| image:: https://img.shields.io/pypi/djversions/maykin-django-prosemirror.svg

.. |pypi-version| image:: https://img.shields.io/pypi/v/maykin-django-prosemirror.svg
    :target: https://pypi.org/project/maykin-django-prosemirror/
