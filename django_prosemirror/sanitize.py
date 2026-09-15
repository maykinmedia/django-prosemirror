"""URL scheme validation for document attributes.

Prosemirror documents carry user-supplied URLs in attributes (``link.href``,
``filer_image.src``). These end up in rendered HTML, where a ``javascript:`` or
``data:`` URL is a script injection vector. Neither the prosemirror schema nor
``Node.from_json`` inspects attribute values, so the check lives here.

Mirrored in ``frontend/utils/sanitize.ts``; keep both in sync.
"""

import re

ALLOWED_URL_SCHEMES: frozenset[str] = frozenset({"http", "https", "mailto", "tel"})
"""Schemes permitted in document URLs. Relative URLs are always permitted."""

URL_MARK_ATTRS: dict[str, tuple[str, ...]] = {"link": ("href",)}
"""Mark type name -> attributes holding a URL."""

URL_NODE_ATTRS: dict[str, tuple[str, ...]] = {"filer_image": ("src",)}
"""Node type name -> attributes holding a URL."""

SAFE_FALLBACK_URL = "#"
"""Inert replacement used when rendering a URL that failed validation."""

# A scheme is an ASCII letter followed by letters, digits, "+", "-" or "."
# terminated by a colon (RFC 3986 section 3.1).
_SCHEME_RE = re.compile(r"^[a-zA-Z][a-zA-Z0-9+.\-]*:")

# The WHATWG URL parser ignores leading and trailing "C0 control or space"
# characters and removes tabs and newlines from anywhere in the URL. Both
# tricks hide the scheme from _SCHEME_RE while a browser still executes it, so
# a URL has to be normalised the same way before its scheme is read.
C0_CONTROL_OR_SPACE = "".join(chr(code) for code in range(0x00, 0x20 + 1))
TAB_AND_NEWLINE = "\t\r\n"


def is_safe_url(url: object) -> bool:
    """Check whether a URL is safe to emit into an href/src attribute.

    Relative URLs (no scheme) are safe. Absolute URLs are safe only when their
    scheme is in :data:`ALLOWED_URL_SCHEMES`.

    Args:
        url: The value to check. Non-string values are never safe.

    Returns:
        True if the URL may be rendered as-is.
    """
    if not isinstance(url, str):
        return False

    candidate = url.strip(C0_CONTROL_OR_SPACE)
    for char in TAB_AND_NEWLINE:
        candidate = candidate.replace(char, "")

    match = _SCHEME_RE.match(candidate)
    if match is None:
        # No scheme: a relative URL, fragment or query. Nothing to execute.
        return True

    scheme = match.group(0).removesuffix(":").lower()
    return scheme in ALLOWED_URL_SCHEMES


def sanitize_url(url: object, fallback: str = SAFE_FALLBACK_URL) -> str:
    """Return ``url`` when safe, otherwise an inert placeholder.

    Used at render time, where raising would break pages that display documents
    stored before this validation existed.
    """
    if not is_safe_url(url):
        return fallback
    assert isinstance(url, str)  # narrowed by is_safe_url
    return url
