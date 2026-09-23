"""URL scheme validation for document attributes.

Prosemirror documents carry user-supplied URLs in attributes (``link.href``,
``filer_image.src``). These end up in rendered HTML, where a ``javascript:`` or
``data:`` URL is a script injection vector. Neither the prosemirror schema nor
``Node.from_json`` inspects attribute values, so the check lives here.

Mirrored in ``frontend/utils/sanitize.ts``; keep both in sync.
"""

import logging
from urllib.parse import urlsplit

logger = logging.getLogger(__name__)

ALLOWED_URL_SCHEMES: frozenset[str] = frozenset({"http", "https", "mailto", "tel"})
"""Schemes permitted in document URLs. Relative URLs are always permitted."""

URL_MARK_ATTRS: dict[str, tuple[str, ...]] = {"link": ("href",)}
"""Mark type name -> attributes holding a URL."""

URL_NODE_ATTRS: dict[str, tuple[str, ...]] = {"filer_image": ("src",)}
"""Node type name -> attributes holding a URL."""

SAFE_FALLBACK_URL = "#"
"""Inert replacement used when rendering a URL that failed validation."""


def is_safe_url(url: object) -> bool:
    """
    Check whether a URL is safe to emit into an href/src attribute.

    Relative URLs (no scheme) are safe. Absolute URLs are safe only when their
    scheme is in :data:`ALLOWED_URL_SCHEMES`.

    ``urlsplit`` strips leading C0 control/space and removes tabs and
    newlines per the WHATWG URL spec before parsing, which is what keeps a
    URL like ``" javascript:alert(1)"`` or ``"java\\tscript:alert(1)"`` from
    hiding its scheme from a browser - and from us.

    Args:
        url: The value to check. Non-string values are never safe.

    Returns:
        True if the URL may be rendered as-is.
    """
    if not isinstance(url, str):
        return False

    try:
        scheme = urlsplit(url).scheme
    except ValueError:  # malformed URL
        return False

    # No scheme: a relative URL, fragment or query. Nothing to execute.
    return scheme == "" or scheme in ALLOWED_URL_SCHEMES


def sanitize_url(url: object, fallback: str = SAFE_FALLBACK_URL) -> str:
    """
    Return ``url`` when safe, otherwise an inert placeholder.

    Used at render time, where raising would break pages that display documents
    stored before this validation existed.
    """
    if not is_safe_url(url):
        logger.warning("Replaced unsafe URL with fallback %r: %r", fallback, url)
        return fallback
    assert isinstance(url, str)  # narrowed by is_safe_url
    return url
