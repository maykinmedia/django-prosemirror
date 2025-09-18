"""Serialization and deserialization functions for Prosemirror documents."""

from typing import cast

from prosemirror import Schema
from prosemirror.model import DOMSerializer, Node
from prosemirror.model.from_dom import from_html

from django_prosemirror.constants import EMPTY_DOC
from django_prosemirror.schema import ProsemirrorDocument


def _clean_empty_attrs(doc: ProsemirrorDocument, schema: Schema) -> ProsemirrorDocument:
    """Remove empty attrs from marks that don't have attributes defined in the schema.

    The prosemirror library automatically adds empty attrs: {} to all marks during
    HTML parsing, even when the mark specification doesn't define any attributes.
    This function cleans those up to match the expected document structure.

    Also removes marks from text nodes inside nodes that don't allow marks (like code_
    block). Additionally, removes node attributes that match their default values.
    """

    def clean_node(node: dict, parent_node_type=None):
        if not isinstance(node, dict):
            raise ValueError(f"{node} is not a dict")

        node_type = node.get("type")

        # Check if current node type disallows marks
        parent_disallows_marks = False
        if parent_node_type:
            parent_node_spec = schema.nodes.get(parent_node_type)
            if parent_node_spec and parent_node_spec.spec.get("marks") == "":
                parent_disallows_marks = True

        # Clean up image node attributes that match default values
        if node_type == "filer_image" and "attrs" in node:
            node_spec = schema.nodes.get(node_type)
            if node_spec and hasattr(node_spec, "spec") and "attrs" in node_spec.spec:
                cleaned_attrs = {}
                for attr_name, attr_value in node["attrs"].items():
                    attr_spec = node_spec.spec["attrs"].get(attr_name, {})
                    default_value = attr_spec.get("default")
                    # Keep attribute only if it doesn't match the default value
                    if attr_value != default_value:
                        cleaned_attrs[attr_name] = attr_value

                # Update node with cleaned attrs, or remove attrs entirely if empty
                if cleaned_attrs:
                    node = {**node, "attrs": cleaned_attrs}
                else:
                    node = {k: v for k, v in node.items() if k != "attrs"}

        # Clean up marks in text nodes
        if node_type == "text" and "marks" in node:
            if parent_disallows_marks:
                # Remove all marks if parent node doesn't allow marks
                node = {k: v for k, v in node.items() if k != "marks"}
            else:
                # Clean empty attrs from marks
                cleaned_marks = []
                for mark in node["marks"]:
                    if isinstance(mark, dict) and "type" in mark:
                        mark_type = schema.marks.get(mark["type"])
                        # If mark has empty attrs and the mark type doesn't define attrs
                        # remove attrs
                        if (
                            mark_type
                            and mark.get("attrs") == {}
                            and (
                                not hasattr(mark_type, "attrs")
                                or (hasattr(mark_type, "attrs") and not mark_type.attrs)
                            )
                        ):
                            cleaned_mark = {
                                k: v for k, v in mark.items() if k != "attrs"
                            }
                            cleaned_marks.append(cleaned_mark)
                        else:
                            cleaned_marks.append(mark)
                    else:
                        cleaned_marks.append(mark)
                node = {**node, "marks": cleaned_marks}

        # Recursively clean content, passing current node type as parent
        if "content" in node:
            node = {
                **node,
                "content": [clean_node(child, node_type) for child in node["content"]],
            }

        return node

    return clean_node(cast(dict, doc))


def doc_to_html(value: ProsemirrorDocument, *, schema: Schema) -> str:
    """Convert a Prosemirror document to HTML.

    Args:
        value: object containing the Prosemirror document
        schema: Prosemirror schema defining document structure

    Returns:
        str: HTML representation of the document
    """
    if not value:
        return ""

    content = Node.from_json(schema, value)
    serializer = DOMSerializer.from_schema(schema)
    return str(serializer.serialize_fragment(content))


def html_to_doc(value: str, *, schema: Schema) -> ProsemirrorDocument:
    """Convert HTML to a Prosemirror document.

    Args:
        value: HTML string to convert
        schema: Prosemirror schema defining document structure

    Returns:
        ProsemirrorDocument: Document as dict/JSON structure
    """
    if not value.strip():
        # Return empty document for empty/whitespace-only strings
        return EMPTY_DOC

    doc = from_html(schema, value)
    return _clean_empty_attrs(doc, schema)
