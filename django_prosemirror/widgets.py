"""Django widget for rendering Prosemirror editor in forms."""

import json
from collections.abc import Mapping
from typing import Any

from django.forms.widgets import Widget

from django_prosemirror.config import ProsemirrorConfig
from django_prosemirror.schema import MarkType, NodeType


class ProsemirrorWidget(Widget):
    """Django form widget for Prosemirror rich text editor.

    This widget renders a Prosemirror editor in Django forms with
    configurable schema specifications.
    """

    template_name = "widget.html"
    config: ProsemirrorConfig

    def __init__(
        self,
        *args,
        allowed_node_types: list[NodeType] | None = None,
        allowed_mark_types: list[MarkType] | None = None,
        tag_to_classes: Mapping[str, str] | None = None,
        history: bool | None = None,
        **kwargs,
    ):
        """Initialize the widget with allowed node and mark types."""
        super().__init__(*args, **kwargs)
        self.config = ProsemirrorConfig(
            allowed_node_types=allowed_node_types,
            allowed_mark_types=allowed_mark_types,
            tag_to_classes=tag_to_classes,
            history=history,
        )

    def get_context(self, name, value, attrs):
        """Get the context data for rendering the widget template."""
        attrs = super().get_context(name, value, attrs)
        attrs["schema"] = json.dumps(self.config.all_schema_types)
        attrs["classes"] = json.dumps(self.config.tag_to_classes)
        attrs["history"] = json.dumps(self.config.history)
        return attrs


    class Media:
        js = ("js/django-prosemirror.js",)
        css = {
            "all": ("css/django-prosemirror.css",),
        }
