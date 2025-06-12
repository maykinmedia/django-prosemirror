"""Django template tags for including Prosemirror assets."""

from django import template
from django.templatetags.static import static
from django.utils.safestring import SafeString, mark_safe

register = template.Library()


def _js_path() -> str:
    return static("js/django-prosemirror.js")


@register.simple_tag
def include_django_prosemirror_js() -> SafeString:
    return mark_safe(f'<script src="{_js_path()}"></script>')


@register.simple_tag
def include_django_prosemirror_js_defer() -> SafeString:
    return mark_safe(f'<script src="{_js_path()}" defer></script>')


@register.simple_tag
def include_django_prosemirror_css() -> SafeString:
    css_url = static("css/django-prosemirror.css")
    return mark_safe(f'<link rel="stylesheet" href="{css_url}">')
