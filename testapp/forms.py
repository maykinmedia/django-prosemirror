from django import forms

from django_prosemirror.fields import ProsemirrorFormField
from django_prosemirror.schema import FULL, AllowedNodeType
from testapp.models import TestModel


class TestForm(forms.Form):
    heading_only = ProsemirrorFormField(
        schema=[AllowedNodeType.HEADING],
        classes={"paragraph": "HElloooo", "heading": "test"},
    )
    full_schema = ProsemirrorFormField(schema=FULL)


class TestModelForm(forms.ModelForm):
    class Meta:
        model = TestModel
        fields = (
            "full_schema_with_default",
            "full_schema_nullable",
            "text_formatting_only",
        )
