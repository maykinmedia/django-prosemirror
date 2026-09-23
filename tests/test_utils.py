"""Tests for django_prosemirror.utils — generic document tree walking."""

import copy

from django_prosemirror.utils import process_document


def _keep(item, kind):
    return item


def test_returns_input_unchanged_when_no_content_key():
    doc = {"type": "doc"}

    new_doc, changed = process_document(doc, _keep)

    assert new_doc is doc
    assert changed is False


def test_returns_input_unchanged_when_content_empty():
    doc = {"type": "doc", "content": []}

    new_doc, changed = process_document(doc, _keep)

    assert new_doc is doc
    assert changed is False


def test_noop_callback_leaves_document_untouched():
    doc = {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Hi", "marks": [{"type": "strong"}]}
                ],
            }
        ],
    }

    new_doc, changed = process_document(doc, _keep)

    assert new_doc is doc
    assert changed is False


def test_node_with_no_marks_key_is_untouched():
    doc = {"type": "doc", "content": [{"type": "paragraph"}]}

    def fail_on_mark(item, kind):
        assert kind != "mark"
        return item

    new_doc, changed = process_document(doc, fail_on_mark)

    assert new_doc is doc
    assert changed is False


def test_node_with_empty_marks_list_is_untouched():
    doc = {"type": "doc", "content": [{"type": "text", "text": "hi", "marks": []}]}

    new_doc, changed = process_document(doc, _keep)

    assert new_doc is doc
    assert changed is False


def test_drops_a_mark():
    doc = {
        "type": "doc",
        "content": [
            {
                "type": "text",
                "text": "hi",
                "marks": [{"type": "link", "attrs": {"href": "javascript:1"}}],
            }
        ],
    }

    def drop_link_marks(item, kind):
        if kind == "mark" and item["type"] == "link":
            return None
        return item

    new_doc, changed = process_document(doc, drop_link_marks)

    assert changed is True
    assert new_doc is not doc
    assert "marks" not in new_doc["content"][0] or new_doc["content"][0]["marks"] == []


def test_keeps_safe_marks_and_preserves_order():
    doc = {
        "type": "doc",
        "content": [
            {
                "type": "text",
                "text": "hi",
                "marks": [
                    {"type": "strong"},
                    {"type": "link", "attrs": {"href": "javascript:1"}},
                    {"type": "em"},
                ],
            }
        ],
    }

    def drop_link_marks(item, kind):
        if kind == "mark" and item["type"] == "link":
            return None
        return item

    new_doc, changed = process_document(doc, drop_link_marks)

    assert changed is True
    assert new_doc["content"][0]["marks"] == [{"type": "strong"}, {"type": "em"}]


def test_drops_a_node():
    doc = {
        "type": "doc",
        "content": [
            {"type": "filer_image", "attrs": {"src": "javascript:1"}},
            {"type": "paragraph", "content": [{"type": "text", "text": "kept"}]},
        ],
    }

    def drop_unsafe_images(item, kind):
        if kind == "node" and item["type"] == "filer_image":
            return None
        return item

    new_doc, changed = process_document(doc, drop_unsafe_images)

    assert changed is True
    assert new_doc is not doc
    assert len(new_doc["content"]) == 1
    assert new_doc["content"][0]["type"] == "paragraph"


def test_dropped_node_skips_its_own_marks_entirely():
    doc = {
        "type": "doc",
        "content": [
            {
                "type": "filer_image",
                "attrs": {"src": "javascript:1"},
                "marks": [{"type": "unreachable"}],
            }
        ],
    }

    def callback(item, kind):
        if kind == "node" and item["type"] == "filer_image":
            return None
        if kind == "mark":
            raise AssertionError("mark on a dropped node must never be visited")
        return item

    new_doc, changed = process_document(doc, callback)

    assert changed is True
    assert new_doc["content"] == []


def test_modifies_a_node_in_place_of_dropping():
    doc = {"type": "doc", "content": [{"type": "filer_image", "attrs": {"src": "bad"}}]}

    def fix_src(item, kind):
        if kind == "node" and item["type"] == "filer_image":
            return {**item, "attrs": {**item["attrs"], "src": "fixed"}}
        return item

    new_doc, changed = process_document(doc, fix_src)

    assert changed is True
    assert new_doc["content"][0]["attrs"]["src"] == "fixed"


def test_finds_unsafe_url_nested_several_levels_deep():
    doc = {
        "type": "doc",
        "content": [
            {
                "type": "blockquote",
                "content": [
                    {
                        "type": "bullet_list",
                        "content": [
                            {
                                "type": "list_item",
                                "content": [
                                    {
                                        "type": "paragraph",
                                        "content": [
                                            {
                                                "type": "text",
                                                "text": "deep",
                                                "marks": [
                                                    {
                                                        "type": "link",
                                                        "attrs": {
                                                            "href": "javascript:1"
                                                        },
                                                    }
                                                ],
                                            }
                                        ],
                                    }
                                ],
                            }
                        ],
                    }
                ],
            }
        ],
    }

    def drop_link_marks(item, kind):
        if kind == "mark" and item["type"] == "link":
            return None
        return item

    new_doc, changed = process_document(doc, drop_link_marks)

    assert changed is True
    deep_text = new_doc["content"][0]["content"][0]["content"][0]["content"][0]
    assert deep_text.get("marks", []) == []


def test_root_doc_marks_are_never_visited_or_touched():
    doc = {
        "type": "doc",
        "marks": [{"type": "link", "attrs": {"href": "javascript:1"}}],
        "content": [{"type": "paragraph"}],
    }

    def drop_link_marks(item, kind):
        assert item is not doc
        if kind == "mark" and item["type"] == "link":
            return None
        return item

    new_doc, changed = process_document(doc, drop_link_marks)

    assert changed is False
    assert new_doc is doc
    assert new_doc["marks"] == [{"type": "link", "attrs": {"href": "javascript:1"}}]


def test_does_not_mutate_the_input_document():
    doc = {
        "type": "doc",
        "content": [
            {
                "type": "text",
                "text": "hi",
                "marks": [{"type": "link", "attrs": {"href": "javascript:1"}}],
            }
        ],
    }
    original = copy.deepcopy(doc)

    def drop_link_marks(item, kind):
        if kind == "mark" and item["type"] == "link":
            return None
        return item

    process_document(doc, drop_link_marks)

    assert doc == original
