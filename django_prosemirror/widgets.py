"""Django widget for rendering Prosemirror editor in forms."""

import json
from collections.abc import Mapping
from typing import Any

from django.forms.widgets import Widget

from django_prosemirror.schema import MarkType, NodeType, SchemaFactory


class ProsemirrorWidget(Widget):
    """Django form widget for Prosemirror rich text editor.

    This widget renders a Prosemirror editor in Django forms with
    configurable schema specifications.
    """

    template_name = "widget.html"
    allowed_node_types: list[NodeType] | None
    allowed_mark_types: list[MarkType] | None
    tag_to_classes: Mapping[str, str] | None
    history: bool

    def __init__(
        self,
        *args,
        allowed_node_types: list[NodeType] | None = None,
        allowed_mark_types: list[MarkType] | None = None,
        tag_to_classes: Mapping[str, str] | None = None,
        history: bool = True,
        **kwargs,
    ):
        """Initialize the widget with allowed node and mark types."""
        super().__init__(*args, **kwargs)

        self.allowed_node_types = allowed_node_types
        self.allowed_mark_types = allowed_mark_types
        self.tag_to_classes = tag_to_classes
        self.history = history

    def get_context(self, name, value, attrs):
        """Get the context data for rendering the widget template."""
        attrs = super().get_context(name, value, attrs)

        # Serialize node and mark types as a single list of strings
        schema_types = []
        if self.allowed_node_types:
            schema_types.extend(
                node_type.value for node_type in self.allowed_node_types
            )
        if self.allowed_mark_types:
            schema_types.extend(
                mark_type.value for mark_type in self.allowed_mark_types
            )

        attrs["schema"] = json.dumps(schema_types)
        attrs["classes"] = json.dumps(self.tag_to_classes)
        attrs["history"] = "true" if self.history else "false"

        return attrs

    class Media:
        js = ("js/django-prosemirror.js",)
        css = {
            "all": ("css/django-prosemirror.css",),
        }
