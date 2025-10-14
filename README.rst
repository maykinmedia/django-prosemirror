

django-prosemirror
==================

:Version: 0.1.0
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

The field provides both document and HTML representations:

.. code-block:: python

    post = BlogPost.objects.get(pk=1)

    # Access as ProseMirror document (dict)
    doc_content = post.content.doc
    # Output: {
    #     "type": "doc",
    #     "content": [
    #         {
    #             "type": "heading",
    #             "attrs": {"level": 1},
    #             "content": [{"type": "text", "text": "Heading"}]
    #         },
    #         {
    #             "type": "paragraph",
    #             "content": [
    #                 {"type": "text", "text": "Paragraph content..."}
    #             ]
    #         }
    #     ]
    # }

    # Access as HTML
    html_content = post.content.html
    # Output: "<h1>Heading</h1><p>Paragraph content...</p>"

    # Modify content from HTML, which will be converted to a Prosemirror document internally
    post.content.html = "<h2>New heading</h2><p>Updated content</p>"
    post.save()

    # After modification, the document structure is updated
    updated_doc = post.content.doc
    # Output: {
    #     "type": "doc",
    #     "content": [
    #         {
    #             "type": "heading",
    #             "attrs": {"level": 2},
    #             "content": [{"type": "text", "text": "New heading"}]
    #         },
    #         {
    #             "type": "paragraph",
    #             "content": [{"type": "text", "text": "Updated content"}]
    #         }
    #     ]
    # }

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

    class Article(models.Model):
        # ✅ Correct: Using a callable
        content = ProseMirrorModelField(
            default=lambda: {"type": "doc", "content": []}
        )

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

Advanced Usage
==============

Programmatic Content Creation
-----------------------------

Create ProseMirror content programmatically:

.. code-block:: python

    # Create a document with heading and paragraph
    content = {
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
                    {
                        "type": "text",
                        "marks": [{"type": "strong"}],
                        "text": "bold"
                    },
                    {"type": "text", "text": " text."}
                ]
            }
        ]
    }

    article = Article.objects.create(content=content)


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
