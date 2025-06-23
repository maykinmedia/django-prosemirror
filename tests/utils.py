"""Test utilities for django-prosemirror tests."""

from prosemirror import Schema

from django_prosemirror.schema import SchemaSpec, construct_schema_from_spec


def assert_schemas_equivalent(
    schema1: Schema | SchemaSpec, schema2: Schema | SchemaSpec
) -> None:
    """Helper function to assert two schemas have equivalent structure.

    Args:
        schema1: Either a Schema object or SchemaSpec (will be converted to Schema)
        schema2: Either a Schema object or SchemaSpec (will be converted to Schema)
    """
    # Convert SchemaSpecs to Schema objects if needed
    actual_schema1 = (
        schema1 if isinstance(schema1, Schema) else construct_schema_from_spec(schema1)
    )
    actual_schema2 = (
        schema2 if isinstance(schema2, Schema) else construct_schema_from_spec(schema2)
    )

    assert actual_schema1.nodes.keys() == actual_schema2.nodes.keys()
    assert actual_schema1.marks.keys() == actual_schema2.marks.keys()
