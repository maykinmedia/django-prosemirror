"""Tests for django_prosemirror.migration_utils — data migration helpers."""

import pytest

from django_prosemirror.fields import ProsemirrorFieldDocument
from django_prosemirror.migration_utils import (
    RepairRecord,
    clear_corrupt_prosemirror_rows,
    iter_corrupt_prosemirror_rows,
    iter_schema_invalid_prosemirror_rows,
    nullify_corrupt_prosemirror_rows,
    repair_prosemirror_html_strings,
)
from testapp.models import TestModel

pytestmark = [pytest.mark.django_db]

VALID_DOC = {
    "type": "doc",
    "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Good"}]}],
}


def _corrupt(instance, field_name, html_string):
    """Store an HTML string directly in a ProseMirror JSON column.

    .update() bypasses __set__, so it routes through get_prep_value which
    serialises the string as a JSON string — exactly how corrupt data ends up
    in the DB from a deploy that lacked type-checking.
    """
    type(instance).objects.filter(pk=instance.pk).update(**{field_name: html_string})


class TestFindCorruptProsemirrorRows:
    def test_finds_html_string_rows(self):
        good = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        bad = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        _corrupt(bad, "full_schema_with_default", "<p>Corrupt</p>")

        corrupt_pks = {
            pk
            for pk, _ in iter_corrupt_prosemirror_rows(
                TestModel, "full_schema_with_default"
            )
        }

        assert bad.pk in corrupt_pks
        assert good.pk not in corrupt_pks

    def test_yields_raw_html_value(self):
        instance = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        _corrupt(instance, "full_schema_with_default", "<p>Hello</p>")

        results = list(
            iter_corrupt_prosemirror_rows(TestModel, "full_schema_with_default")
        )

        assert len(results) == 1
        pk, raw = results[0]
        assert pk == instance.pk
        assert raw == "<p>Hello</p>"

    def test_empty_when_no_corrupt_rows(self):
        TestModel.objects.create(full_schema_with_default=VALID_DOC)

        results = list(
            iter_corrupt_prosemirror_rows(TestModel, "full_schema_with_default")
        )

        assert results == []

    def test_handles_nullable_field_with_none(self):
        TestModel.objects.create(full_schema_nullable=None)

        results = list(iter_corrupt_prosemirror_rows(TestModel, "full_schema_nullable"))
        assert results == []

    def test_plain_text_string_is_also_detected(self):
        instance = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        _corrupt(instance, "full_schema_with_default", "just plain text")

        corrupt_pks = {
            pk
            for pk, _ in iter_corrupt_prosemirror_rows(
                TestModel, "full_schema_with_default"
            )
        }

        assert instance.pk in corrupt_pks

    def test_non_string_corrupt_values_are_also_detected(self):
        """JSONField accepts any JSON type, so lists/booleans/numbers are corrupt."""
        instance = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        TestModel.objects.filter(pk=instance.pk).update(
            full_schema_with_default=[{"type": "doc"}]
        )

        corrupt_pks = {
            pk
            for pk, _ in iter_corrupt_prosemirror_rows(
                TestModel, "full_schema_with_default"
            )
        }

        assert instance.pk in corrupt_pks

    def test_dict_with_wrong_shape_is_detected(self):
        """A dict that lacks the basic doc structure is also considered corrupt."""
        instance = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        TestModel.objects.filter(pk=instance.pk).update(
            full_schema_with_default={"type": "paragraph", "content": []}
        )

        corrupt_pks = {
            pk
            for pk, _ in iter_corrupt_prosemirror_rows(
                TestModel, "full_schema_with_default"
            )
        }

        assert instance.pk in corrupt_pks

    def test_dict_missing_content_key_is_detected(self):
        instance = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        TestModel.objects.filter(pk=instance.pk).update(
            full_schema_with_default={"type": "doc"}
        )

        corrupt_pks = {
            pk
            for pk, _ in iter_corrupt_prosemirror_rows(
                TestModel, "full_schema_with_default"
            )
        }

        assert instance.pk in corrupt_pks

    def test_schema_invalid_but_correctly_shaped_doc_is_not_flagged(self):
        empty_doc = {"type": "doc", "content": []}
        instance = TestModel.objects.create(basic_text_only=empty_doc)
        heading_doc = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "Not allowed"}],
                }
            ],
        }
        TestModel.objects.filter(pk=instance.pk).update(basic_text_only=heading_doc)

        corrupt_pks = {
            pk for pk, _ in iter_corrupt_prosemirror_rows(TestModel, "basic_text_only")
        }

        assert instance.pk not in corrupt_pks


class TestFindSchemaInvalidProsemirrorRows:
    def test_detects_doc_that_violates_field_schema(self):
        """A heading stored in a paragraph-only field should be flagged."""
        empty_doc = {"type": "doc", "content": []}
        instance = TestModel.objects.create(basic_text_only=empty_doc)
        heading_doc = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "Not allowed"}],
                }
            ],
        }
        TestModel.objects.filter(pk=instance.pk).update(basic_text_only=heading_doc)

        invalid_pks = {
            pk
            for pk, _ in iter_schema_invalid_prosemirror_rows(
                TestModel, "basic_text_only"
            )
        }

        assert instance.pk in invalid_pks

    def test_does_not_flag_valid_doc(self):
        empty_doc = {"type": "doc", "content": []}
        instance = TestModel.objects.create(basic_text_only=empty_doc)

        invalid_pks = {
            pk
            for pk, _ in iter_schema_invalid_prosemirror_rows(
                TestModel, "basic_text_only"
            )
        }

        assert instance.pk not in invalid_pks

    def test_does_not_flag_corrupt_rows(self):
        instance = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        TestModel.objects.filter(pk=instance.pk).update(
            full_schema_with_default="<p>Corrupt</p>"
        )

        invalid_pks = {
            pk
            for pk, _ in iter_schema_invalid_prosemirror_rows(
                TestModel, "full_schema_with_default"
            )
        }

        assert instance.pk not in invalid_pks


class TestRepairProsemirrorHtmlStrings:
    def test_repairs_corrupt_rows(self):
        instance = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        _corrupt(instance, "full_schema_with_default", "<p>Corrupt</p>")

        records = repair_prosemirror_html_strings(TestModel, "full_schema_with_default")

        assert len(records) == 1
        instance.refresh_from_db()
        doc = instance.full_schema_with_default
        assert isinstance(doc, ProsemirrorFieldDocument)
        assert "Corrupt" in doc.html

    def test_returns_empty_list_when_nothing_to_repair(self):
        TestModel.objects.create(full_schema_with_default=VALID_DOC)

        records = repair_prosemirror_html_strings(TestModel, "full_schema_with_default")

        assert records == []

    def test_record_contains_pk_original_and_repaired(self):
        instance = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        _corrupt(instance, "full_schema_with_default", "<p>Hello</p>")

        records = repair_prosemirror_html_strings(TestModel, "full_schema_with_default")

        assert len(records) == 1
        record = records[0]
        assert isinstance(record, RepairRecord)
        assert record.pk == instance.pk
        assert record.original == "<p>Hello</p>"
        assert isinstance(record.repaired, dict)
        assert record.repaired["type"] == "doc"

    def test_does_not_touch_clean_rows(self):
        clean = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        corrupt = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        _corrupt(corrupt, "full_schema_with_default", "<p>Bad</p>")

        repair_prosemirror_html_strings(TestModel, "full_schema_with_default")

        clean.refresh_from_db()
        assert clean.__dict__["full_schema_with_default"] == VALID_DOC

    def test_repairs_multiple_corrupt_rows(self):
        instances = [
            TestModel.objects.create(full_schema_with_default=VALID_DOC)
            for _ in range(3)
        ]
        for inst in instances:
            _corrupt(inst, "full_schema_with_default", "<p>Bad</p>")

        records = repair_prosemirror_html_strings(TestModel, "full_schema_with_default")

        assert len(records) == 3
        for inst in instances:
            inst.refresh_from_db()
            assert isinstance(inst.full_schema_with_default, ProsemirrorFieldDocument)

    def test_derives_schema_from_field_when_not_provided(self):
        instance = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        _corrupt(instance, "full_schema_with_default", "<p>Auto schema</p>")

        repair_prosemirror_html_strings(TestModel, "full_schema_with_default")

        instance.refresh_from_db()
        assert "Auto schema" in instance.full_schema_with_default.html

    def test_accepts_explicit_schema(self):
        from django_prosemirror.config import ProsemirrorConfig
        from django_prosemirror.schema import NodeType

        instance = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        _corrupt(instance, "full_schema_with_default", "<p>Explicit schema</p>")

        schema = ProsemirrorConfig(allowed_node_types=[NodeType.PARAGRAPH]).schema
        repair_prosemirror_html_strings(
            TestModel, "full_schema_with_default", schema=schema
        )

        instance.refresh_from_db()
        assert "Explicit schema" in instance.full_schema_with_default.html

    def test_skips_non_string_corrupt_values(self):
        """Non-string corrupt values are out of scope — use nullify or clear instead."""
        instance = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        TestModel.objects.filter(pk=instance.pk).update(
            full_schema_with_default=[{"type": "doc"}]
        )

        records = repair_prosemirror_html_strings(TestModel, "full_schema_with_default")

        assert records == []


class TestNullifyCorruptProsemirrorRows:
    def test_nullifies_corrupt_rows(self):
        instance = TestModel.objects.create(full_schema_nullable=VALID_DOC)
        _corrupt(instance, "full_schema_nullable", "<p>Corrupt</p>")

        records = nullify_corrupt_prosemirror_rows(TestModel, "full_schema_nullable")

        assert len(records) == 1
        assert records[0].pk == instance.pk
        assert records[0].repaired is None
        instance.refresh_from_db()
        assert instance.full_schema_nullable.doc is None

    def test_raises_for_non_nullable_field(self):
        with pytest.raises(ValueError, match="does not allow null values"):
            nullify_corrupt_prosemirror_rows(TestModel, "full_schema_with_default")

    def test_returns_empty_list_when_nothing_to_repair(self):
        TestModel.objects.create(full_schema_nullable=VALID_DOC)

        records = nullify_corrupt_prosemirror_rows(TestModel, "full_schema_nullable")

        assert records == []

    def test_record_contains_original_value(self):
        instance = TestModel.objects.create(full_schema_nullable=VALID_DOC)
        TestModel.objects.filter(pk=instance.pk).update(
            full_schema_nullable=[{"type": "doc"}]
        )

        records = nullify_corrupt_prosemirror_rows(TestModel, "full_schema_nullable")

        assert records[0].original == [{"type": "doc"}]
        assert records[0].repaired is None


class TestClearCorruptProsemirrorRows:
    def test_clears_corrupt_rows_to_empty_doc(self):
        instance = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        _corrupt(instance, "full_schema_with_default", "<p>Corrupt</p>")

        records = clear_corrupt_prosemirror_rows(TestModel, "full_schema_with_default")

        assert len(records) == 1
        assert records[0].repaired == {"type": "doc", "content": []}
        instance.refresh_from_db()
        assert not instance.full_schema_with_default  # empty doc is falsy

    def test_works_on_non_nullable_field(self):
        instance = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        _corrupt(instance, "full_schema_with_default", "<p>Corrupt</p>")

        records = clear_corrupt_prosemirror_rows(TestModel, "full_schema_with_default")

        assert len(records) == 1

    def test_returns_empty_list_when_nothing_to_repair(self):
        TestModel.objects.create(full_schema_with_default=VALID_DOC)

        records = clear_corrupt_prosemirror_rows(TestModel, "full_schema_with_default")

        assert records == []

    def test_record_contains_original_value(self):
        instance = TestModel.objects.create(full_schema_with_default=VALID_DOC)
        TestModel.objects.filter(pk=instance.pk).update(
            full_schema_with_default=[{"type": "doc"}]
        )

        records = clear_corrupt_prosemirror_rows(TestModel, "full_schema_with_default")

        assert records[0].original == [{"type": "doc"}]
        assert records[0].repaired == {"type": "doc", "content": []}
