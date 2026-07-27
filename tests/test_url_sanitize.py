"""Tests for URL scheme validation."""

import pytest

from django_prosemirror.sanitize import is_safe_url, sanitize_url

SAFE_URLS = [
    "https://example.com",
    "http://example.com/path?q=1#frag",
    "HTTPS://EXAMPLE.COM",
    "mailto:someone@example.com",
    "tel:+31612345678",
    "//example.com/protocol-relative",
    "/absolute/path",
    "relative/path",
    "example.com",
    "#fragment",
    "?query=1",
    "",
]

UNSAFE_URLS = [
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "JaVaScRiPt:alert(1)",
    # Browsers strip tabs/newlines from URLs, making these executable.
    "java\nscript:alert(1)",
    "java\tscript:alert(1)",
    "java\r\nscript:alert(1)",
    # Leading whitespace and C0 controls are ignored by browsers.
    "  javascript:alert(1)",
    "\x01javascript:alert(1)",
    "\x00javascript:alert(1)",
    "\tjavascript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "blob:https://example.com/uuid",
    # Not in the allow-list.
    "ftp://example.com/file",
    # Parsed as scheme "example.com" by browsers, not as a host.
    "example.com:8080",
]


@pytest.mark.parametrize("url", SAFE_URLS)
def test_is_safe_url_accepts_allowed_schemes_and_relative_urls(url):
    assert is_safe_url(url) is True


@pytest.mark.parametrize("url", UNSAFE_URLS)
def test_is_safe_url_rejects_disallowed_schemes(url):
    assert is_safe_url(url) is False


@pytest.mark.parametrize("url", [None, 123, [], {}, b"https://example.com"])
def test_is_safe_url_rejects_non_string_values(url):
    assert is_safe_url(url) is False


@pytest.mark.parametrize("url", SAFE_URLS)
def test_sanitize_url_returns_safe_urls_unchanged(url):
    assert sanitize_url(url) == url


@pytest.mark.parametrize("url", UNSAFE_URLS)
def test_sanitize_url_replaces_unsafe_urls_with_placeholder(url):
    assert sanitize_url(url) == "#"


def test_sanitize_url_uses_provided_fallback():
    assert sanitize_url("javascript:alert(1)", fallback="") == ""


def test_sanitize_url_replaces_non_string_values():
    assert sanitize_url(None) == "#"
