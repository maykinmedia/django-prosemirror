"""Tests to verify django-prosemirror works without filer dependency.

These tests are designed to run in nofiler environments where filer is not installed.
They verify that basic functionality works without IMAGE node types.
"""

from django.test import TestCase
from django.urls import NoReverseMatch, reverse

import pytest

from django_prosemirror import urls as prosemirror_urls
from django_prosemirror.config import ProsemirrorConfig
from django_prosemirror.fields import ProsemirrorFormField, ProsemirrorModelField
from django_prosemirror.schema import NodeType

pytestmark = pytest.mark.nofiler


class TestNoFilerCompatibility(TestCase):
    def test_basic_config_without_image(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING]
        )
        self.assertNotIn(NodeType.IMAGE, config.allowed_node_types)
        self.assertIn(NodeType.PARAGRAPH, config.allowed_node_types)

    def test_form_field_works_without_image(self):
        field = ProsemirrorFormField(
            allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING]
        )
        self.assertIsInstance(field, ProsemirrorFormField)

    def test_model_field_works_without_image(self):
        """Test that model field works without IMAGE node type."""
        field = ProsemirrorModelField(
            allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING]
        )
        self.assertIsInstance(field, ProsemirrorModelField)

    def test_schema_generation_without_image(self):
        config = ProsemirrorConfig(
            allowed_node_types=[
                NodeType.PARAGRAPH,
                NodeType.HEADING,
                NodeType.BLOCKQUOTE,
            ]
        )
        schema = config.schema
        self.assertIn("paragraph", schema.spec["nodes"])
        self.assertIn("heading", schema.spec["nodes"])
        self.assertNotIn("image", schema.spec["nodes"])

    def test_widget_context_without_image(self):
        from django_prosemirror.widgets import ProsemirrorWidget

        widget = ProsemirrorWidget(
            allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING]
        )

        context = widget.get_context("test_field", "", {})
        # Widget should not have image support enabled
        self.assertEqual(context["filer_upload_url"], None)

    def test_filer_urls_not_included_when_filer_unavailable(self):
        """Test that filer URLs are not included when filer is unavailable."""
        # Check that filer URLs are not in the urlpatterns
        url_names = [
            pattern.name
            for pattern in prosemirror_urls.urlpatterns
            if hasattr(pattern, "name")
        ]

        self.assertNotIn("filer_upload_handler", url_names)
        self.assertNotIn("filer_edit_handler", url_names)

    def test_reverse_fails_for_filer_urls_when_unavailable(self):
        """Test that reversing filer URLs fails when filer is unavailable."""
        # These should raise NoReverseMatch since filer URLs are not registered
        with self.assertRaises(NoReverseMatch):
            reverse("filer_upload_handler")

        with self.assertRaises(NoReverseMatch):
            reverse("filer_edit_handler", kwargs={"image_pk": "1"})
