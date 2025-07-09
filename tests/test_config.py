"""Tests for ProsemirrorConfig class."""

import itertools
from collections.abc import Mapping

import pytest
from prosemirror import Schema

from django_prosemirror.config import ProsemirrorConfig
from django_prosemirror.constants import DEFAULT_SETTINGS
from django_prosemirror.schema import MarkType, NodeType


class TestProsemirrorConfigDefaults:
    """Test default values for ProsemirrorConfig."""

    def test_default_settings_contains_all_node_types(self):
        all_node_values = [node_type.value for node_type in NodeType]
        default_node_values = DEFAULT_SETTINGS["allowed_node_types"]

        assert set(all_node_values) == set(default_node_values), (
            f"DEFAULT_SETTINGS node types {set(default_node_values)} "
            f"don't match all NodeType enum values {set(all_node_values)}"
        )

        assert len(default_node_values) == len(all_node_values), (
            f"DEFAULT_SETTINGS has {len(default_node_values)} node types, "
            f"but NodeType enum has {len(all_node_values)} values"
        )

    def test_default_settings_contains_all_mark_types(self):
        all_mark_values = [mark_type.value for mark_type in MarkType]
        default_mark_values = DEFAULT_SETTINGS["allowed_mark_types"]

        assert set(all_mark_values) == set(default_mark_values), (
            f"DEFAULT_SETTINGS mark types {set(default_mark_values)} "
            f"don't match all MarkType enum values {set(all_mark_values)}"
        )

        assert len(default_mark_values) == len(all_mark_values), (
            f"DEFAULT_SETTINGS has {len(default_mark_values)} mark types, "
            f"but MarkType enum has {len(all_mark_values)} values"
        )

    def test_default_settings_strings_convert_to_enums(self):
        for node_str in DEFAULT_SETTINGS["allowed_node_types"]:
            try:
                node_enum = NodeType(node_str)
                assert node_enum.value == node_str
            except ValueError:
                pytest.fail(
                    f"Could not convert node type string '{node_str}' to NodeType enum"
                )

        for mark_str in DEFAULT_SETTINGS["allowed_mark_types"]:
            try:
                mark_enum = MarkType(mark_str)
                assert mark_enum.value == mark_str
            except ValueError:
                pytest.fail(
                    f"Could not convert mark type string '{mark_str}' to MarkType enum"
                )

    def test_default_allowed_node_types_taken_from_default_settings(self):
        config = ProsemirrorConfig()
        expected_nodes = [NodeType(s) for s in DEFAULT_SETTINGS["allowed_node_types"]]

        assert config.allowed_node_types == expected_nodes
        assert len(config.allowed_node_types) == len(
            DEFAULT_SETTINGS["allowed_node_types"]
        )

    def test_default_allowed_mark_types_taken_from_default_settings(self):
        config = ProsemirrorConfig()
        expected_marks = [MarkType(s) for s in DEFAULT_SETTINGS["allowed_mark_types"]]

        assert config.allowed_mark_types == expected_marks
        assert len(config.allowed_mark_types) == len(
            DEFAULT_SETTINGS["allowed_mark_types"]
        )

    def test_default_history_taken_from_default_settings(self):
        config = ProsemirrorConfig()

        assert config.history == DEFAULT_SETTINGS["history"]

    def test_default_tag_to_classes_taken_from_default_settings(self):
        config = ProsemirrorConfig()

        assert config.tag_to_classes == DEFAULT_SETTINGS["tag_to_classes"]
        assert isinstance(config.tag_to_classes, Mapping)

    def test_config_can_build_schema(self):
        config = ProsemirrorConfig()

        assert isinstance(config.schema, Schema)


class TestProsemirrorConfigValidation:
    """Test validation logic for ProsemirrorConfig."""

    @pytest.mark.parametrize(
        "node_types",
        list(
            itertools.combinations(
                [node for node in NodeType if node != NodeType.PARAGRAPH], 2
            ),
        ),
    )
    def test_paragraph_required_in_node_types(self, node_types):
        with pytest.raises(ValueError, match="must include.*PARAGRAPH"):
            ProsemirrorConfig(allowed_node_types=node_types)

    @pytest.mark.parametrize(
        "param_name,invalid_value,error_match",
        [
            (
                "allowed_node_types",
                [NodeType.PARAGRAPH, "invalid"],
                "Expected NodeType enum",
            ),
            (
                "allowed_node_types",
                [NodeType.PARAGRAPH, 123],
                "Expected NodeType enum",
            ),
            ("allowed_mark_types", ["invalid"], "Expected MarkType enum"),
            (
                "allowed_mark_types",
                [MarkType.STRONG, 123],
                "Expected MarkType enum",
            ),
        ],
    )
    def test_invalid_type_validation(self, param_name, invalid_value, error_match):
        """Test that invalid node/mark types raise TypeError."""
        with pytest.raises(TypeError, match=error_match):
            ProsemirrorConfig(**{param_name: invalid_value})


class TestProsemirrorConfigExplicitValues:
    """Test ProsemirrorConfig with explicitly set values."""

    def test_explicit_node_types(self):
        node_types = [NodeType.PARAGRAPH, NodeType.HEADING, NodeType.BLOCKQUOTE]
        config = ProsemirrorConfig(allowed_node_types=node_types)

        assert config.allowed_node_types == node_types

    def test_explicit_mark_types(self):
        mark_types = [MarkType.STRONG, MarkType.ITALIC]
        config = ProsemirrorConfig(allowed_mark_types=mark_types)

        assert config.allowed_mark_types == mark_types

    def test_explicit_history_true(self):
        config = ProsemirrorConfig(history=True)

        assert config.history is True

    def test_explicit_history_false(self):
        """Test setting history to False explicitly."""
        config = ProsemirrorConfig(history=False)

        assert config.history is False

    def test_explicit_tag_to_classes(self):
        """Test setting explicit tag_to_classes mapping."""
        custom_classes = {"paragraph": "my-paragraph", "heading": "my-heading"}
        config = ProsemirrorConfig(tag_to_classes=custom_classes)

        assert (
            config.tag_to_classes == DEFAULT_SETTINGS["tag_to_classes"] | custom_classes
        )

    def test_empty_mark_types_allowed(self):
        """Test that empty mark types list is allowed."""
        config = ProsemirrorConfig(allowed_mark_types=[])

        assert config.allowed_mark_types == []


class TestProsemirrorConfigSchema:
    """Test schema generation from ProsemirrorConfig."""

    def test_create_schema_with_valid_node_and_mark_types(
        self,
    ):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH] + [NodeType.HEADING],
            allowed_mark_types=[MarkType.STRONG],
        )
        schema = config.schema

        expected_nodes = {"doc", "paragraph", "text", "heading"}
        expected_marks = {"strong"}

        assert set(schema.nodes.keys()) == expected_nodes
        assert set(schema.marks.keys()) == expected_marks

    def test_schema_with_minimal_config(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema

        # Should have core nodes
        assert "doc" in schema.spec["nodes"]
        assert "paragraph" in schema.spec["nodes"]
        assert "text" in schema.spec["nodes"]

        # Should have no marks beyond core
        assert len(schema.spec["marks"]) == 0

    def test_create_schema_with_empty_spec_creates_minimal_schema(
        self,
    ):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema

        expected_nodes = {"doc", "paragraph", "text"}
        expected_marks = set()

        assert set(schema.nodes.keys()) == expected_nodes
        assert set(schema.marks.keys()) == expected_marks

    def test_create_schema_with_all_types_includes_all_nodes_and_marks(
        self,
    ):
        config = ProsemirrorConfig()
        schema = config.schema

        expected_nodes = {
            # Core nodes
            "doc",
            "paragraph",
            "text",
            # Additional nodes
            "blockquote",
            "horizontal_rule",
            "heading",
            "code_block",
            "image",
            "hard_break",
            "ordered_list",
            "list_item",
            "bullet_list",
            "table",
            "table_row",
            "table_header",
            "table_cell",
        }
        expected_marks = {"link", "em", "strong", "code", "strikethrough", "underline"}

        assert set(schema.nodes.keys()) == expected_nodes
        assert set(schema.marks.keys()) == expected_marks

    @pytest.mark.parametrize(
        "node_types,mark_types",
        [
            ([NodeType.HEADING], []),
            ([], [MarkType.STRONG, MarkType.ITALIC]),
            ([NodeType.BLOCKQUOTE, NodeType.CODE_BLOCK], []),
            ([NodeType.IMAGE], [MarkType.LINK]),
            ([NodeType.HORIZONTAL_RULE, NodeType.HARD_BREAK], []),
        ],
    )
    def test_create_schema_from_combinations_creates_valid_schemas_with_core_nodes(
        self, node_types, mark_types
    ):
        node_types_with_paragraph = (
            [NodeType.PARAGRAPH] + node_types if node_types else [NodeType.PARAGRAPH]
        )
        config = ProsemirrorConfig(
            allowed_node_types=node_types_with_paragraph, allowed_mark_types=mark_types
        )
        schema = config.schema

        # Build expected sets based on node_types and mark_types
        expected_nodes = {"doc", "paragraph", "text"}  # Core nodes always present
        expected_marks = set()

        for node_type in node_types:
            expected_nodes.add(node_type.value)

        for mark_type in mark_types:
            expected_marks.add(mark_type.value)

        assert set(schema.nodes.keys()) == expected_nodes
        assert set(schema.marks.keys()) == expected_marks
