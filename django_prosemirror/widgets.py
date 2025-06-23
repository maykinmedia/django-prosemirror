"""Django widget for rendering Prosemirror editor in forms."""

import json

from django.forms.widgets import Widget

from django_prosemirror.constants import DEFAULT_CLASSES
from django_prosemirror.schema import SchemaSpec


class ProsemirrorWidget(Widget):
    """Django form widget for Prosemirror rich text editor.

    This widget renders a Prosemirror editor in Django forms with
    configurable schema specifications.
    """

    template_name = "widget.html"
    schema: SchemaSpec
    classes = DEFAULT_CLASSES
    history = True

    def __init__(
        self,
        *args,
        schema: SchemaSpec,
        classes=DEFAULT_CLASSES,
        history=True,
        **kwargs,
    ):
        """Initialize the widget with a Prosemirror schema."""
        super().__init__(*args, **kwargs)
        self.schema = schema
        self.classes = classes
        self.history = history

    def get_context(self, name, value, attrs):
        """Get the context data for rendering the widget template."""
        attrs = super().get_context(name, value, attrs)
        schema_spec = [s.value for s in self.schema]
        attrs["schema"] = json.dumps(schema_spec)
        attrs["classes"] = json.dumps(self.classes)
        attrs["history"] = "true" if self.history else "false"

        return attrs

    class Media:
        js = ("js/django-prosemirror.js",)
        css = {
            "all": ("css/django-prosemirror.css",),
        }
