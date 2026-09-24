"""Generic tree utilities for ProseMirror JSON documents."""

from collections.abc import Callable
from typing import Any, Literal

type DocumentItemKind = Literal["node", "mark"]
type DocumentCallback = Callable[
    [dict[str, Any], DocumentItemKind], dict[str, Any] | None
]


def _process_node(
    node: dict[str, Any], callback: DocumentCallback
) -> tuple[dict[str, Any] | None, bool]:
    """Recursively apply `callback` to `node`, its marks, and its content"""

    new_node = callback(node, "node")
    if new_node is None:
        return None, True
    changed = new_node is not node

    marks = new_node.get("marks")
    if marks:
        new_marks = []
        marks_changed = False
        for mark in marks:
            new_mark = callback(mark, "mark")
            if new_mark is None:
                marks_changed = True
                continue
            if new_mark is not mark:
                marks_changed = True
            new_marks.append(new_mark)
        if marks_changed:
            new_node = {**new_node, "marks": new_marks}
            changed = True

    content = new_node.get("content")
    if content:
        new_content = []
        content_changed = False
        for child in content:
            new_child, child_changed = _process_node(child, callback)
            if child_changed:
                content_changed = True
            if new_child is not None:
                new_content.append(new_child)
        if content_changed:
            new_node = {**new_node, "content": new_content}
            changed = True

    return new_node, changed


def process_document(
    doc: dict[str, Any], callback: DocumentCallback
) -> tuple[dict[str, Any], bool]:
    """
    Recursively rebuild a ProseMirror JSON document, applying ``callback``
    to every content node and every mark it carries.

    For each node under ``doc["content"]``, ``callback(node, "node")`` runs
    first; unless that drops the node, ``callback(mark, "mark")`` then runs
    for each of its marks, and the walk recurses into its own content.

    ``callback`` returns the item (unchanged or modified) to keep it, or
    ``None`` to drop it - a mark from its node's ``marks``, a node from its
    parent's ``content`` (along with that node's own marks/descendants,
    which are then never visited).

    The root ``doc`` itself is never passed to ``callback`` and never
    dropped, mirroring ``prosemirror.model.Node.descendants``, which also
    never calls its callback on the root.

    Dropping a node can leave the document structurally invalid against its
    schema (e.g. an empty parent) - this function doesn't re-validate the
    result; callers that care should.

    Args:
        doc: A ProseMirror document dict (``{"type": "doc", "content": [...]}``).
            Never mutated in place.
        callback: Called for every content node and every mark, as described
            above.

    Returns:
        ``(new_doc, changed)``. ``new_doc is doc`` and ``changed is False``
        when nothing was modified.
    """
    content = doc.get("content")
    if not content:
        return doc, False

    new_content = []
    changed = False
    for child in content:
        new_child, child_changed = _process_node(child, callback)
        if child_changed:
            changed = True
        if new_child is not None:
            new_content.append(new_child)

    if not changed:
        return doc, False
    return {**doc, "content": new_content}, True
