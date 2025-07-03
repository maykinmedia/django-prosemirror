from unittest.mock import Mock

from django_prosemirror.config import ProsemirrorConfig
from django_prosemirror.constants import EMPTY_DOC
from django_prosemirror.fields import ProsemirrorFieldDocument
from django_prosemirror.schema import NodeType


class TestProsemirrorFieldDocument:
    def test_init_with_parameters(self):
        """Test field document initialization with and without sync callback."""
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema
        doc_data = {"type": "doc", "content": []}
        callback = Mock()

        # Test minimal parameters (no callback)
        doc_minimal = ProsemirrorFieldDocument(
            doc_data,
            schema=schema,
            sync_to_field_callback=callback,
        )

        assert doc_minimal._raw_data == doc_data
        assert doc_minimal.schema == schema
        assert doc_minimal._sync_callback is callback

    def test_dunder_str_returns_html_representation(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING],
            allowed_mark_types=[],
        )
        schema = config.schema
        doc_data = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "Hello"}],
                }
            ],
        }

        doc = ProsemirrorFieldDocument(doc_data, schema=schema)
        assert str(doc) == "<h1>Hello</h1>"

    def test_raw_data_contains_document_structure(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema
        doc_data = {"type": "doc", "content": []}

        doc = ProsemirrorFieldDocument(doc_data, schema=schema)

        assert doc.raw_data == doc_data

    def test_doc_property_getter_returns_raw_data(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema
        doc_data = {"type": "doc", "content": []}

        doc = ProsemirrorFieldDocument(doc_data, schema=schema)

        assert doc.doc == doc_data == doc.raw_data

    def test_doc_property_setter_updates_raw_data(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema
        original_data = {"type": "doc", "content": []}
        new_data = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Updated"}],
                }
            ],
        }
        doc = ProsemirrorFieldDocument(original_data, schema=schema)
        doc.doc = new_data

        assert doc._raw_data == new_data

    def test_doc_property_setter_calls_sync_callback(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema
        original_data = {"type": "doc", "content": []}
        new_data = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Updated"}],
                }
            ],
        }
        callback = Mock()

        doc = ProsemirrorFieldDocument(
            original_data, sync_to_field_callback=callback, schema=schema
        )
        doc.doc = new_data

        callback.assert_called_once_with(new_data)

    def test_reduce_method_for_pickle_support(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema
        doc_data = {"type": "doc", "content": []}
        callback = Mock()

        doc = ProsemirrorFieldDocument(
            doc_data, sync_to_field_callback=callback, schema=schema
        )

        # Test that __reduce__ returns the expected structure
        cls, args, kwargs = doc.__reduce__()

        assert cls == ProsemirrorFieldDocument, "Should return correct class"
        assert args == (doc_data,), "Should return document data as *args"
        assert kwargs == {"schema": schema}, "Should return schema in **kwargs"

        # Test that we can reconstruct the document using reduce output
        restored_doc = cls(*args, **kwargs)
        assert restored_doc.doc == doc_data, "Reconstructed doc should match original"
        assert restored_doc._sync_callback is None, "Callback should not be preserved"

    def test_empty_document_handling(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema

        doc = ProsemirrorFieldDocument(EMPTY_DOC, schema=schema)

        assert doc.doc == EMPTY_DOC
        assert doc.html == ""
        assert doc.raw_data == EMPTY_DOC

    def test_sync_to_model_called_when_callback_exists(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema
        doc_data = {"type": "doc", "content": []}
        callback = Mock()

        doc = ProsemirrorFieldDocument(
            doc_data, sync_to_field_callback=callback, schema=schema
        )

        # Manually call _sync_to_model to test it
        doc._sync_to_model()

        callback.assert_called_once_with(doc_data)

    def test_sync_to_model_handles_no_callback(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema
        doc_data = {"type": "doc", "content": []}

        doc = ProsemirrorFieldDocument(doc_data, schema=schema)

        # Should not raise an error when no callback is set
        doc._sync_to_model()

    def test_html_property_getter_converts_to_html(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema
        doc_data = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Hello world"}],
                }
            ],
        }

        doc = ProsemirrorFieldDocument(doc_data, schema=schema)

        assert doc.html == "<p>Hello world</p>"

    def test_html_property_setter_updates_document_from_html(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING],
            allowed_mark_types=[],
        )
        schema = config.schema
        original_data = {"type": "doc", "content": []}
        callback = Mock()

        doc = ProsemirrorFieldDocument(
            original_data, sync_to_field_callback=callback, schema=schema
        )

        # Set HTML and verify it converts to document structure
        doc.html = "<h1>New Title</h1>"

        expected_data = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "New Title"}],
                }
            ],
        }

        assert doc.doc == expected_data
        assert doc.html == "<h1>New Title</h1>"
        callback.assert_called_once_with(expected_data)

    def test_html_setter_calls_sync_callback(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING],
            allowed_mark_types=[],
        )
        schema = config.schema
        original_data = {"type": "doc", "content": []}
        callback = Mock()

        doc = ProsemirrorFieldDocument(
            original_data, sync_to_field_callback=callback, schema=schema
        )

        # Set HTML which should trigger sync callback
        doc.html = "<h1>New Title</h1>"

        # Verify callback was called with the converted document
        expected_data = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "New Title"}],
                }
            ],
        }
        callback.assert_called_once_with(expected_data)

    def test_reduce_preserves_complex_document_structure(self):
        """Test that __reduce__ works correctly with complex document structures."""
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING],
            allowed_mark_types=[],
        )
        schema = config.schema
        doc_data = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "Title"}],
                }
            ],
        }
        callback = Mock()

        # Create document with callback
        original_doc = ProsemirrorFieldDocument(
            doc_data, sync_to_field_callback=callback, schema=schema
        )

        # Test reconstruction via __reduce__
        cls, args, kwargs = original_doc.__reduce__()
        restored_doc = cls(*args, **kwargs)

        assert restored_doc.doc == doc_data, "Document data should be preserved"
        assert restored_doc.html == "<h1>Title</h1>", (
            "HTML conversion should work after reconstruction"
        )
        assert restored_doc._sync_callback is None, "Callback should not be preserved"

    def test_document_property_chaining(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING],
            allowed_mark_types=[],
        )
        schema = config.schema
        original_data = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "Original Title"}],
                }
            ],
        }

        doc = ProsemirrorFieldDocument(original_data, schema=schema)

        assert doc.html == "<h2>Original Title</h2>", "Initial state should be correct"

        # Modify through doc property
        new_data = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "Updated Title"}],
                }
            ],
        }
        doc.doc = new_data

        assert doc.doc == new_data, "Doc property should be updated"
        assert doc.raw_data == new_data, "Raw data should be consistent"
        assert doc.html == "<h1>Updated Title</h1>", "HTML should reflect the changes"

    def test_sync_callback_not_called_when_none(self):
        """Test that no error occurs when sync callback is None."""
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema
        doc_data = {"type": "doc", "content": []}
        doc = ProsemirrorFieldDocument(
            doc_data, schema=schema, sync_to_field_callback=None
        )

        # Should not raise any error when modifying without callback
        new_data = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Updated"}],
                }
            ],
        }
        doc.doc = new_data

        assert doc.doc == new_data
