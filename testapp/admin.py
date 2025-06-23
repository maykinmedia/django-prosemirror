import json

from django.contrib import admin
from django.utils.safestring import mark_safe

from testapp.models import TestModel


@admin.register(TestModel)
class TestModelAdmin(admin.ModelAdmin):
    fields = (
        "full_schema_with_default",
        "full_schema_with_default_html",
        "full_schema_with_default_json",
        "full_schema_nullable",
        "basic_text_only",
        "text_formatting_only",
    )
    readonly_fields = (
        "full_schema_with_default_html",
        "full_schema_with_default_json",
    )

    @admin.display()
    def full_schema_with_default_html(self, obj):
        return mark_safe(obj.full_schema_with_default.html)

    @admin.display()
    def full_schema_with_default_json(self, obj):
        json_string = json.dumps(obj.full_schema_with_default.doc, indent=2)
        return mark_safe(f"<pre><code>{json_string}</code></pre>")
