from django import forms

from django_prosemirror.fields import ProsemirrorFormField
from django_prosemirror.schema import NodeType
from testapp.models import TestModel


class TestForm(forms.Form):
    heading_only = ProsemirrorFormField(
        allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING],
        allowed_mark_types=[],
        tag_to_classes={
            "paragraph": "test_override_pargraph",
            "heading": "test_override_heading",
        },
    )
    full_schema = ProsemirrorFormField()  # All node and mark types (default)


class TestModelForm(forms.ModelForm):
    class Meta:
        model = TestModel
        fields = (
            "full_schema_with_default",
            "full_schema_nullable",
            "text_formatting_only",
        )
