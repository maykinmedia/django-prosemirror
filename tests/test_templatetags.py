from unittest import TestCase

from django.template import Context, Template


class ProsemirrorTemplateTagsTests(TestCase):
    def test_include_django_prosemirror_js_tag_renders_script_tag(self):
        template = Template(
            "{% load django_prosemirror %}{% include_django_prosemirror_js %}"
        )
        rendered = template.render(Context())

        assert rendered == '<script src="/static/js/django-prosemirror.js"></script>'

    def test_include_django_prosemirror_js_defer_tag_renders_script_defer_tag(self):
        template = Template(
            "{% load django_prosemirror %}{% include_django_prosemirror_js_defer %}"
        )
        rendered = template.render(Context())

        expected = '<script src="/static/js/django-prosemirror.js" defer></script>'
        assert rendered == expected

    def test_include_django_prosemirror_css_tag_renders_link_tag(self):
        template = Template(
            "{% load django_prosemirror %}{% include_django_prosemirror_css %}"
        )
        rendered = template.render(Context())

        expected = '<link rel="stylesheet" href="/static/css/django-prosemirror.css">'
        assert rendered == expected

    def test_multiple_tags_in_template_render_expected_tags(self):
        template = Template(
            "{% load django_prosemirror %}"
            "<!DOCTYPE html>"
            "<html>"
            "<head>"
            "{% include_django_prosemirror_css %}"
            "{% include_django_prosemirror_js_defer %}"
            "</head>"
            "<body>"
            "<h1>Test Page</h1>"
            "</body>"
            "</html>"
        )
        rendered = template.render(Context())

        expected = (
            "<!DOCTYPE html>"
            "<html>"
            "<head>"
            '<link rel="stylesheet" href="/static/css/django-prosemirror.css">'
            '<script src="/static/js/django-prosemirror.js" defer></script>'
            "</head>"
            "<body>"
            "<h1>Test Page</h1>"
            "</body>"
            "</html>"
        )
        assert rendered == expected

    def test_template_tag_can_be_loaded(self):
        """Test that the template tag library loads without errors."""
        template = Template("{% load django_prosemirror %}")
        rendered = template.render(Context())

        assert rendered == ""
