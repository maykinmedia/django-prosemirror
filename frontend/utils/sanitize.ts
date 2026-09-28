/**
 * URL scheme validation for document attributes.
 *
 * Prosemirror documents carry user-supplied URLs in attributes (`link.href`,
 * `filer_image.src`). These end up in rendered HTML, where a `javascript:` or
 * `data:` URL is a script injection vector.
 *
 * Mirrored in `django_prosemirror/sanitize.py`; keep both in sync.
 */

/**
 * Schemes permitted in document URLs. Relative URLs are always permitted.
 *
 * The link prompt's validation message names these schemes; update the
 * translations too when this set changes.
 */
export const ALLOWED_URL_SCHEMES: ReadonlySet<string> = new Set([
    "http",
    "https",
    "mailto",
    "tel",
]);

/** Inert replacement used when rendering a URL that failed validation. */
export const SAFE_FALLBACK_URL = "#";

// A scheme is an ASCII letter followed by letters, digits, "+", "-" or "."
// terminated by a colon (RFC 3986 section 3.1).
const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

// The WHATWG URL parser ignores leading and trailing "C0 control or space"
// characters and removes tabs and newlines from anywhere in the URL. Both
// tricks hide the scheme from SCHEME_RE while a browser still executes it, so
// a URL has to be normalised the same way before its scheme is read.
// eslint-disable-next-line no-control-regex
const C0_CONTROL_OR_SPACE_RE = /^[\x00-\x20]+|[\x00-\x20]+$/g;
const TAB_AND_NEWLINE_RE = /[\t\r\n]/g;

/**
 * Check whether a URL is safe to emit into an href/src attribute.
 *
 * Relative URLs (no scheme) are safe. Absolute URLs are safe only when their
 * scheme is in `ALLOWED_URL_SCHEMES`. Non-string values are never safe.
 */
export function isSafeUrl(url: unknown): url is string {
    if (typeof url !== "string") return false;

    const candidate = url
        .replace(C0_CONTROL_OR_SPACE_RE, "")
        .replace(TAB_AND_NEWLINE_RE, "");

    const match = SCHEME_RE.exec(candidate);
    if (match === null) {
        // No scheme: a relative URL, fragment or query. Nothing to execute.
        return true;
    }

    const scheme = match[0].slice(0, -1).toLowerCase();
    return ALLOWED_URL_SCHEMES.has(scheme);
}

/**
 * Return `url` when safe, otherwise an inert placeholder.
 *
 * Used at render time, where throwing would break pages that display documents
 * stored before this validation existed.
 */
export function sanitizeUrl(
    url: unknown,
    fallback: string = SAFE_FALLBACK_URL,
): string {
    return isSafeUrl(url) ? url : fallback;
}
