import gc
import weakref

import pytest

from django_prosemirror.fields import ProsemirrorFieldDocument
from testapp.models import TestModel

pytestmark = [
    pytest.mark.django_db,
]


@pytest.fixture
def test_document():
    return {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": "Test content"}],
            }
        ],
    }


@pytest.fixture
def another_document():
    return {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": "Different content"}],
            }
        ],
    }


class TestProsemirrorFieldCache:
    def test_field_identity_on_repeated_access(self, test_document):
        """Test that accessing the same field returns the same object (cached)."""
        instance = TestModel.objects.create(full_schema_with_default=test_document)

        # Multiple accesses should return the same cached object
        doc1 = instance.full_schema_with_default
        doc2 = instance.full_schema_with_default
        doc3 = instance.full_schema_with_default

        assert doc1 is doc2 is doc3
        assert isinstance(doc1, ProsemirrorFieldDocument)

    def test_unsaved_instance_cache_identity(self):
        """Test that unsaved instances get cached properly for identity."""
        unsaved = TestModel()

        # First access creates and caches
        doc1 = unsaved.full_schema_with_default
        # Second access should return same cached object
        doc2 = unsaved.full_schema_with_default

        assert doc1 is doc2
        assert unsaved.pk is None
        assert isinstance(doc1, ProsemirrorFieldDocument)

    def test_saved_instance_cache_identity(self, test_document):
        """Test that saved instances get cached properly for identity."""
        instance = TestModel.objects.create(full_schema_with_default=test_document)

        # First access creates and caches
        doc1 = instance.full_schema_with_default
        # Second access should return same cached object
        doc2 = instance.full_schema_with_default

        assert doc1 is doc2
        assert instance.pk is not None

    def test_cache_survives_field_updates(self):
        """Test that cache identity is maintained when field is updated."""
        unsaved = TestModel()

        # Get initial cached document
        doc = unsaved.full_schema_with_default
        original_id = id(doc)

        # Update through the document wrapper
        doc.html = "<p>Updated content</p>"

        # Get document again - should be same object
        doc2 = unsaved.full_schema_with_default
        assert id(doc2) == original_id
        assert doc is doc2

    def test_cache_sync_on_external_change(self):
        """Test that cached documents sync when underlying data changes externally."""
        unsaved = TestModel()

        # Set initial data
        initial_data = {"type": "doc", "content": []}
        unsaved.full_schema_with_default = initial_data

        # Get cached document
        doc = unsaved.full_schema_with_default
        assert doc.doc == initial_data

        # Change underlying data directly
        new_data = {
            "type": "doc",
            "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": "New"}]}
            ],
        }
        unsaved.__dict__["full_schema_with_default"] = new_data

        # Next access should update cached document with new data
        doc2 = unsaved.full_schema_with_default
        assert doc is doc2  # Same object
        assert doc.doc == new_data  # But with updated data

    def test_different_instances_different_caches(self):
        """Test that different instances get separate cache entries."""
        unsaved1 = TestModel()
        unsaved2 = TestModel()

        doc1 = unsaved1.full_schema_with_default
        doc2 = unsaved2.full_schema_with_default

        # Should be different objects for different instances
        assert doc1 is not doc2

        # Modifying one shouldn't affect the other
        doc1.html = "<p>Instance 1</p>"
        doc2.html = "<p>Instance 2</p>"

        assert "Instance 1" in doc1.html
        assert "Instance 2" in doc2.html

    def test_different_fields_different_caches(self, test_document, another_document):
        """Test that different fields on same instance get separate cache entries."""
        instance = TestModel.objects.create(
            full_schema_with_default=test_document,
            full_schema_nullable=another_document,
        )

        doc1 = instance.full_schema_with_default
        doc2 = instance.full_schema_nullable

        # Should be different objects for different fields
        assert doc1 is not doc2
        assert doc1.doc == test_document
        assert doc2.doc == another_document

    def test_cache_cleanup_for_saved_instances(self, test_document):
        descriptor = TestModel.full_schema_with_default
        initial_cache_size = len(descriptor._saved_instance_cache)

        # Create saved instance and access field to cache it
        instance = TestModel.objects.create(full_schema_with_default=test_document)
        doc = instance.full_schema_with_default

        # Should be in cache
        assert instance in descriptor._saved_instance_cache
        assert len(descriptor._saved_instance_cache) == initial_cache_size + 1

        # Create weak reference to verify instance deletion
        instance_ref = weakref.ref(instance)

        # Delete instance and document references
        del instance
        del doc

        # Force garbage collection
        gc.collect()
        assert instance_ref() is None, "Instance should be garbage collected"

        # Cache should be cleaned up since WeakKeyDictionary removes dead references
        assert len(descriptor._saved_instance_cache) == initial_cache_size

    def test_cache_cleanup_for_unsaved_instances(self, test_document):
        """Test that unsaved instance cache is cleaned up when instances are deleted."""
        descriptor = TestModel.full_schema_with_default
        initial_cache_size = len(descriptor._unsaved_instance_cache)

        # Create unsaved instance and access field to cache it
        instance = TestModel(full_schema_with_default=test_document)
        doc = instance.full_schema_with_default

        # Should be in cache
        cache_key = descriptor._get_cache_key(instance)
        assert cache_key in descriptor._unsaved_instance_cache
        assert len(descriptor._unsaved_instance_cache) == initial_cache_size + 1

        # Create weak reference to verify instance deletion
        instance_ref = weakref.ref(instance)

        # Delete instance and document references
        del instance
        del doc

        # Force garbage collection - this should trigger weakref.finalize cleanup
        gc.collect()
        assert instance_ref() is None, "Instance should be garbage collected"

        # Cache should be cleaned up since weakref.finalize removes the entry
        assert len(descriptor._unsaved_instance_cache) == initial_cache_size

    def test_cache_saved_handles_none_values(self):
        instance = TestModel.objects.create(full_schema_nullable=None)

        # Access field with None value
        doc = instance.full_schema_nullable
        assert doc.doc is None

        # Should still be cached
        doc2 = instance.full_schema_nullable
        assert doc is doc2

    def test_cache_unsaved_handles_none_values(self):
        unsaved = TestModel()
        unsaved.full_schema_nullable = None

        # Access field with None value
        doc = unsaved.full_schema_nullable
        assert doc.doc is None

        # Should still be cached
        doc2 = unsaved.full_schema_nullable
        assert doc is doc2

    def test_cache_across_save_boundary(self, test_document):
        """Test cache behavior when instance transitions from unsaved to saved."""
        descriptor = TestModel.full_schema_with_default

        # Create unsaved instance
        unsaved = TestModel(full_schema_with_default=test_document)
        doc_before_save = unsaved.full_schema_with_default

        # Should be in unsaved cache
        unsaved_key = descriptor._get_cache_key(unsaved)
        assert unsaved_key in descriptor._unsaved_instance_cache

        # Save the instance
        unsaved.save()

        # Access field after save
        doc_after_save = unsaved.full_schema_with_default

        # Should be same cached object
        assert doc_before_save is doc_after_save

        # Should now be in saved cache
        assert unsaved in descriptor._saved_instance_cache
        # Note: may or may not be removed from unsaved cache immediately

    def test_multiple_field_descriptors_separate_caches(self, test_document):
        """Test that different field descriptors maintain separate caches."""
        full_schema_with_default_descriptor = TestModel.full_schema_with_default
        full_schema_nullable_descriptor = TestModel.full_schema_nullable

        # These should be different descriptor instances
        assert (
            full_schema_with_default_descriptor is not full_schema_nullable_descriptor
        )

        # Create instance and access both fields
        instance = TestModel.objects.create(
            full_schema_with_default=test_document, full_schema_nullable=test_document
        )

        doc1 = instance.full_schema_with_default
        doc2 = instance.full_schema_nullable

        # Should be in different caches
        assert instance in full_schema_with_default_descriptor._saved_instance_cache
        assert instance in full_schema_nullable_descriptor._saved_instance_cache

        # But the cached documents should be different objects
        assert doc1 is not doc2
