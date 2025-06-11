"""Django widget for rendering Prosemirror editor in forms."""

import json

from django.forms.widgets import Widget

from django_prosemirror.schema import SchemaSpec


class ProsemirrorWidget(Widget):
    """Django form widget for Prosemirror rich text editor.

    This widget renders a Prosemirror editor in Django forms with
    configurable schema specifications.
    """

    template_name = "widget.html"
    schema: SchemaSpec

    def __init__(self, *args, schema: SchemaSpec, **kwargs):
        """Initialize the widget with a Prosemirror schema."""
        super().__init__(*args, **kwargs)
        self.schema = schema

    def get_context(self, name, value, attrs):
        """Get the context data for rendering the widget template."""
        attrs = super().get_context(name, value, attrs)
        schema_spec = [s.value for s in self.schema]
        attrs["schema"] = json.dumps(schema_spec)
        return attrs

    class Media:
        js = ("js/django-prosemirror.js",)
        css = {
            "all": ("css/django-prosemirror.css",),
        }
