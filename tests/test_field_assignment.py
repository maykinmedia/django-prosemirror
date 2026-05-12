"""Tests for accepting HTML strings when setting ProseMirror field values."""

import pytest

from django_prosemirror.fields import ProsemirrorFieldDocument
from testapp.models import TestModel

pytestmark = [
    pytest.mark.django_db,
]


class TestHtmlStringInput:
    def test_objects_create_with_html_string(self):
        """Model.objects.create() should accept an HTML string and convert it."""
        instance = TestModel.objects.create(
            full_schema_with_default="<p>Hello world</p>"
        )
        doc = instance.full_schema_with_default
        assert isinstance(doc, ProsemirrorFieldDocument)
        assert "Hello world" in doc.html

    def test_assign_html_string_to_unsaved_instance(self):
        """Assigning an HTML string directly to a field should convert it to a doc."""
        instance = TestModel()
        instance.full_schema_with_default = "<p>Hello world</p>"
        doc = instance.full_schema_with_default
        assert isinstance(doc, ProsemirrorFieldDocument)
        assert "Hello world" in doc.html

    def test_html_string_roundtrip_through_db(self):
        """HTML string input should survive a DB save/reload cycle."""
        instance = TestModel.objects.create(
            full_schema_with_default="<p>Hello world</p>"
        )
        refreshed = TestModel.objects.get(pk=instance.pk)
        doc = refreshed.full_schema_with_default
        assert isinstance(doc, ProsemirrorFieldDocument)
        assert "Hello world" in doc.html

    def test_assign_html_string_to_saved_instance(self):
        """Assigning an HTML string to a saved instance's field should convert it."""
        instance = TestModel.objects.create(
            full_schema_with_default={"type": "doc", "content": []}
        )
        instance.full_schema_with_default = "<p>Updated via HTML</p>"
        doc = instance.full_schema_with_default
        assert isinstance(doc, ProsemirrorFieldDocument)
        assert "Updated via HTML" in doc.html

    def test_plain_text_string_without_html_tags(self):
        """A plain string with no HTML tags should be accepted and converted."""
        instance = TestModel.objects.create(full_schema_with_default="Just plain text")
        doc = instance.full_schema_with_default
        assert isinstance(doc, ProsemirrorFieldDocument)
        assert "Just plain text" in doc.html
