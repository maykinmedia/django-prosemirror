"""Utilities for working with ProseMirror fields in data migrations."""

import logging
from collections.abc import Iterator
from dataclasses import dataclass
from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from prosemirror import Schema

from django_prosemirror.constants import get_empty_doc
from django_prosemirror.sanitize import URL_MARK_ATTRS, URL_NODE_ATTRS, is_safe_url
from django_prosemirror.schema import ProsemirrorDocumentDict, validate_doc
from django_prosemirror.serde import html_to_doc
from django_prosemirror.utils import DocumentItemKind, process_document

logger = logging.getLogger(__name__)


@dataclass
class RepairRecord:
    """Outcome of repairing a single corrupt ProseMirror field value."""

    pk: Any
    original: Any
    repaired: ProsemirrorDocumentDict | None


def iter_corrupt_prosemirror_rows(
    model: type[models.Model],
    field_name: str,
) -> Iterator[tuple[Any, Any]]:
    """Yield (pk, raw_value) for rows where a ProseMirror field has wrong type or shape.

    Catches values stored as strings, lists, numbers, or dicts with a wrong
    root structure. Safe to call even when some rows would raise ValidationError
    on normal field access.

    Args:
        model: Django model class (real or historical from ``apps.get_model()``).
        field_name: Name of the ProsemirrorModelField to inspect.

    Yields:
        tuple: ``(pk, raw_value)`` for each corrupt row.
    """
    # .values() bypasses the descriptor, so corrupt rows don't raise on read
    for row in model.objects.values("pk", field_name):
        match row[field_name]:
            case {"type": "doc", "content": [*_]} | None:
                pass
            case _:
                yield row["pk"], row[field_name]


def iter_schema_invalid_prosemirror_rows(
    model: type[models.Model],
    field_name: str,
    schema: Schema | None = None,
) -> Iterator[tuple[Any, ProsemirrorDocumentDict]]:
    """Yield (pk, raw_value) for rows with right shape but failing schema validation.

    Complements :func:`iter_corrupt_prosemirror_rows`: only rows that pass the
    basic structure check are tested here, so the two functions cover disjoint sets.

    Args:
        model: Django model class (real or historical from ``apps.get_model()``).
        field_name: Name of the ProsemirrorModelField to inspect.
        schema: ProseMirror schema to validate against. Derived from the field
            definition if not provided.

    Yields:
        tuple: ``(pk, raw_value)`` for each schema-invalid row.
    """
    if schema is None:
        schema = model._meta.get_field(field_name).config.schema

    # .values() bypasses the descriptor, so corrupt rows don't raise on read
    for row in model.objects.values("pk", field_name):
        match row[field_name]:
            case {"type": "doc", "content": [*_]} as value:
                try:
                    validate_doc(value, schema=schema)
                except ValidationError:
                    yield row["pk"], value


def repair_prosemirror_html_strings(
    model: type[models.Model],
    field_name: str,
    schema: Schema | None = None,
) -> list[RepairRecord]:
    """Convert HTML strings stored in a ProseMirror field to proper doc dicts.

    Args:
        model: Django model class (real or historical from ``apps.get_model()``).
        field_name: Name of the ProsemirrorModelField to repair.
        schema: ProseMirror schema to use for conversion. Derived from the field
            definition if not provided.

    Returns:
        list[RepairRecord]: One record per repaired row, for logging or display::

            def migrate(apps, schema_editor):
                MyModel = apps.get_model("myapp", "MyModel")
                records = repair_prosemirror_html_strings(MyModel, "body")
                for r in records:
                    print(f"pk={r.pk}: repaired {r.original!r}")
                print(f"{len(records)} row(s) repaired")
    """
    if schema is None:
        schema = model._meta.get_field(field_name).config.schema

    records: list[RepairRecord] = []
    corrupt_strings = (
        (pk, raw)
        for pk, raw in iter_corrupt_prosemirror_rows(model, field_name)
        if isinstance(raw, str)
    )
    # .values() and .update() bypass the descriptor for both reads and writes
    for pk, raw_value in corrupt_strings:
        fixed = html_to_doc(raw_value, schema=schema)
        model.objects.filter(pk=pk).update(**{field_name: fixed})
        records.append(RepairRecord(pk=pk, original=raw_value, repaired=fixed))

    return records


def nullify_corrupt_prosemirror_rows(
    model: type[models.Model],
    field_name: str,
) -> list[RepairRecord]:
    """Set corrupt ProseMirror field values to NULL.

    Args:
        model: Django model class (real or historical from ``apps.get_model()``).
        field_name: Name of the ProsemirrorModelField to repair.

    Returns:
        list[RepairRecord]: One record per repaired row, for logging or display.

    Raises:
        ValueError: If the field does not allow null values.
    """
    if not model._meta.get_field(field_name).null:
        raise ValueError(
            f"Field '{field_name}' on {model.__name__} does not allow null values."
        )

    # .values() and .update() bypass the descriptor for both reads and writes
    corrupt_rows = list(iter_corrupt_prosemirror_rows(model, field_name))
    if corrupt_rows:
        pks = [pk for pk, _ in corrupt_rows]
        model.objects.filter(pk__in=pks).update(**{field_name: None})
    records = [
        RepairRecord(pk=pk, original=raw_value, repaired=None)
        for pk, raw_value in corrupt_rows
    ]

    return records


def clear_corrupt_prosemirror_rows(
    model: type[models.Model],
    field_name: str,
) -> list[RepairRecord]:
    """Set corrupt ProseMirror field values to an empty document.

    Unlike :func:`nullify_corrupt_prosemirror_rows`, this works for any field
    regardless of nullability.

    Args:
        model: Django model class (real or historical from ``apps.get_model()``).
        field_name: Name of the ProsemirrorModelField to repair.

    Returns:
        list[RepairRecord]: One record per repaired row, for logging or display.
    """
    # .values() and .update() bypass the descriptor for both reads and writes
    corrupt_rows = list(iter_corrupt_prosemirror_rows(model, field_name))
    empty_doc = get_empty_doc()
    if corrupt_rows:
        pks = [pk for pk, _ in corrupt_rows]
        model.objects.filter(pk__in=pks).update(**{field_name: empty_doc})
    records = [
        RepairRecord(pk=pk, original=raw_value, repaired=empty_doc)
        for pk, raw_value in corrupt_rows
    ]

    return records


def sanitize_document(doc: dict[str, Any]) -> tuple[dict[str, Any], bool]:
    """
    Strip nodes and marks carrying an unsafe URL from a document dict.

    For repairing documents stored before URL scheme validation existed:
    without this, a stored unsafe URL renders inertly (see
    ``sanitize_url``/``is_safe_url`` usage in ``to_dom``) but makes the
    document fail :func:`django_prosemirror.schema.validate_doc` the next
    time it is saved, even via an edit to an unrelated field.

    Checks the same attributes :func:`django_prosemirror.schema.validate_doc`
    checks (:data:`django_prosemirror.sanitize.URL_MARK_ATTRS`,
    :data:`django_prosemirror.sanitize.URL_NODE_ATTRS`), via
    :func:`django_prosemirror.sanitize.is_safe_url`. Neither ``href`` (on
    ``link``) nor ``src`` (on ``filer_image``) has a schema default, so an
    unsafe value drops the whole mark or whole node - nulling just the
    attribute would leave a dict that fails to reload.

    Args:
        doc: A ProseMirror document dict. Falsy values (``None``, ``{}``) are
            returned unchanged.

    Returns:
        ``(new_doc, changed)``, matching
        :func:`django_prosemirror.utils.process_document`.
    """
    if not doc:
        return doc, False

    def strip_unsafe(
        item: dict[str, Any], kind: DocumentItemKind
    ) -> dict[str, Any] | None:
        url_attrs = URL_NODE_ATTRS if kind == "node" else URL_MARK_ATTRS
        attrs = item.get("attrs") or {}
        for attr in url_attrs.get(item.get("type"), ()):
            if not is_safe_url(attrs.get(attr)):
                logger.warning(
                    "Stripping %s %r with unsafe URL in %r: %r",
                    kind,
                    item.get("type"),
                    attr,
                    attrs.get(attr),
                )
                return None
        return item

    return process_document(doc, strip_unsafe)


def strip_unsafe_prosemirror_urls(
    model: type[models.Model],
    field_name: str,
) -> list[RepairRecord]:
    """
    Strip nodes/marks carrying an unsafe URL from a ProseMirror field.

    Repairs rows stored before URL scheme validation existed - see
    :func:`sanitize_document`. Only rows with the correct
    ``{"type": "doc", "content": [...]}`` shape are considered;
    corrupt rows are left untouched (see :func:`iter_corrupt_prosemirror_rows`
    and the other repair helpers for those).

    Args:
        model: Django model class (real or historical from ``apps.get_model()``).
        field_name: Name of the ProsemirrorModelField to repair.

    Returns:
        list[RepairRecord]: One record per repaired row, for logging or display.
    """
    records: list[RepairRecord] = []
    # .values() and .update() bypass the descriptor for both reads and writes
    for row in model.objects.values("pk", field_name):
        value = row[field_name]
        if not isinstance(value, dict):
            continue
        if value.get("type") != "doc":
            continue
        if not isinstance(value.get("content"), list):
            continue

        fixed, changed = sanitize_document(value)
        if changed:
            model.objects.filter(pk=row["pk"]).update(**{field_name: fixed})
            records.append(RepairRecord(pk=row["pk"], original=value, repaired=fixed))

    return records
