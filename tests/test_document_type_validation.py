"""Tests for validating that ProseMirror documents are always dicts, not other types."""

import json

from django.core.exceptions import ValidationError

import pytest

from django_prosemirror.config import ProsemirrorConfig
from django_prosemirror.fields import ProsemirrorFieldDocument, ProsemirrorFormField
from django_prosemirror.schema import NodeType
from django_prosemirror.serde import doc_to_html


@pytest.fixture
def schema():
    """Fixture providing a basic ProseMirror schema for testing."""
    config = ProsemirrorConfig(allowed_node_types=[NodeType.PARAGRAPH])
    return config.schema


@pytest.fixture
def form_field():
    """Fixture providing a ProsemirrorFormField for testing."""
    return ProsemirrorFormField(allowed_node_types=[NodeType.PARAGRAPH])


@pytest.fixture
def valid_doc():
    """Fixture providing a valid document dict."""
    return {"type": "doc", "content": []}


@pytest.mark.parametrize(
    "invalid_value",
    [
        pytest.param(
            json.dumps([{"type": "doc", "content": []}]),
            id="json_array_string",
        ),
        pytest.param([{"type": "doc", "content": []}], id="list"),
        pytest.param("not a json string", id="plain_string"),
        pytest.param(42, id="number"),
        pytest.param(3.14, id="float"),
        pytest.param(True, id="boolean"),
    ],
)
def test_form_field_rejects_non_dict_values(form_field, invalid_value):
    """Test that ProsemirrorFormField rejects non-dict values."""
    with pytest.raises((ValidationError, ValueError, TypeError)):
        result = form_field.to_python(invalid_value)
        # If to_python doesn't raise, validate should catch it
        form_field.validate(result)


@pytest.mark.parametrize(
    "valid_value",
    [
        pytest.param({"type": "doc", "content": []}, id="valid_dict"),
        pytest.param(None, id="none"),
    ],
)
def test_prosemirror_field_document_accepts_valid_types(schema, valid_value):
    """Test that ProsemirrorFieldDocument accepts dicts and None."""
    doc = ProsemirrorFieldDocument(valid_value, schema=schema)

    if valid_value is None:
        assert doc.raw_data is None
    else:
        assert isinstance(doc.raw_data, dict)


@pytest.mark.parametrize(
    "invalid_value",
    [
        pytest.param([{"type": "doc"}], id="list"),
        pytest.param("not a dict", id="string"),
        pytest.param(42, id="number"),
        pytest.param(True, id="boolean"),
    ],
)
def test_prosemirror_field_document_rejects_invalid_types(schema, invalid_value):
    """Test that ProsemirrorFieldDocument rejects non-dict/non-None values."""
    with pytest.raises((ValidationError, ValueError, TypeError)):
        ProsemirrorFieldDocument(invalid_value, schema=schema)


def test_prosemirror_field_document_html_property_validates(schema):
    """Test that accessing .html property validates the document type."""
    # Create a document with invalid type (bypassing initial validation)
    doc = ProsemirrorFieldDocument.__new__(ProsemirrorFieldDocument)
    doc._raw_data = [{"type": "doc"}]  # List instead of dict
    doc.schema = schema
    doc._sync_callback = None

    # Accessing html should fail gracefully
    with pytest.raises((ValidationError, ValueError, TypeError, AttributeError)):
        _ = doc.html


@pytest.mark.parametrize(
    "invalid_value",
    [
        pytest.param([{"type": "doc"}], id="list"),
        pytest.param("not a dict", id="string"),
        pytest.param(42, id="number"),
    ],
)
def test_doc_to_html_rejects_invalid_types(schema, invalid_value):
    """Test that doc_to_html validates input type."""
    with pytest.raises((ValidationError, ValueError, TypeError)):
        doc_to_html(invalid_value, schema=schema)  # type: ignore


def test_doc_to_html_accepts_valid_dict(schema, valid_doc):
    """Test that doc_to_html works with valid dict."""
    html = doc_to_html(valid_doc, schema=schema)
    assert isinstance(html, str)


def test_model_field_descriptor_validates_type():
    """Test that the model field descriptor validates document types."""
    from testapp.models import TestModel

    obj = TestModel()

    # Valid dict should work
    obj.full_schema_with_default = {"type": "doc", "content": []}
    doc = obj.full_schema_with_default
    assert isinstance(doc.raw_data, dict)

    # List should be rejected at assignment time
    with pytest.raises((ValidationError, ValueError, TypeError)):
        obj.full_schema_with_default = [{"type": "doc"}]
