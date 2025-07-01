"""Django model and form fields for Prosemirror rich text editor integration."""

import json
import weakref
from collections.abc import Callable, Mapping
from typing import Any, Self, cast

from django import forms
from django.core.exceptions import ValidationError
from django.db import models

from prosemirror import Schema

from django_prosemirror.schema import (
    MarkType,
    NodeType,
    SchemaFactory,
    validate_doc,
)
from django_prosemirror.serde import ProsemirrorDocument, doc_to_html, html_to_doc
from django_prosemirror.widgets import ProsemirrorWidget


class ProsemirrorFieldDocument:
    """Wrapper for Prosemirror document data with HTML/JSON conversion.

    This class provides an interface for working with Prosemirror documents, allowing
    for conversion between document JSON and HTML representations, while maintaining
    synchronization with the underlying model field.

    NOTE: You should not instantiate this class directly. It will be handled for you
    by the DjangoProsemirrorField.
    """

    schema: Schema
    _raw_data: ProsemirrorDocument

    def __init__(
        self,
        raw_data: ProsemirrorDocument,
        *,
        sync_to_field_callback: Callable | None = None,
        schema: Schema,
    ):
        """Initialize a Prosemirror document wrapper."""
        self._raw_data = raw_data
        self._sync_callback = sync_to_field_callback
        self.schema = schema

    def __str__(self):
        """Return the HTML representation of the document."""
        return self.html

    @property
    def raw_data(self) -> ProsemirrorDocument:
        """Get the raw document data."""
        return self._raw_data

    @raw_data.setter
    def raw_data(self, value: ProsemirrorDocument) -> ProsemirrorDocument:
        """Set the raw document data and sync to model.

        Args:
            value: New document data as dict/JSON
        """
        self._raw_data = value
        self._sync_to_model()
        return self._raw_data

    # Mark the setter as altering data
    raw_data.fset.alters_data = True

    @property
    def html(self) -> str:
        """Get the HTML representation of the document."""
        return doc_to_html(self._raw_data, schema=self.schema)

    @html.setter
    def html(self, value: str) -> str:
        """Set the document content from HTML and sync to model.

        Args:
            value: HTML string to convert to document format
        """
        self._raw_data = html_to_doc(value, schema=self.schema)
        self._sync_to_model()
        return self.html

    # Mark the setter as altering data
    html.fset.alters_data = True

    @property
    def doc(self) -> ProsemirrorDocument:
        """Get the document data (alias for raw_data)."""
        return self._raw_data

    @doc.setter
    def doc(self, value: ProsemirrorDocument) -> ProsemirrorDocument:
        """Set the document data and sync to model."""
        self._raw_data = value
        self._sync_to_model()
        return self._raw_data

    # Mark the setter as altering data
    doc.fset.alters_data = True

    def _sync_to_model(self):
        """Sync changes back to the model instance"""
        if self._sync_callback:
            self._sync_callback(self._raw_data)

    def __reduce__(self):
        """Support for pickle serialization."""
        # For pickle serialization - don't include the callback
        return (
            self.__class__,
            (self._raw_data,),  # positional args
            {"schema": self.schema},  # keyword args
        )


class ProsemirrorFieldDescriptor:
    """Descriptor for managing Prosemirror field access on model instances.

    This descriptor handles the conversion between raw field data and
    ProsemirrorFieldDocument instances, providing caching and synchronization.
    """

    schema: Schema
    field: "ProsemirrorModelField"
    _unsaved_instance_cache: dict[str, ProsemirrorFieldDocument]
    _saved_instance_cache: weakref.WeakKeyDictionary[
        models.Model, ProsemirrorFieldDocument
    ]

    def __init__(self, field: "ProsemirrorModelField", schema: Schema):
        """Initialize the field descriptor.

        Args:
            field: The ProsemirrorModelField instance
            schema: Prosemirror schema for document validation
        """
        self.schema = schema
        self.field = field

        # To avoid memory leaks, we want to ensure our cached objects get removed
        # when they are garbage collected. However, because unsaved model instances
        # are not hashable, we have to track those separately and clean them up
        # using an explicit weakref reference and callback.
        #
        # Note also that we use the caching less for performance and more to ensure
        # a stable identity across multiple references to `field_name`.
        self._unsaved_instance_cache = {}
        self._saved_instance_cache = weakref.WeakKeyDictionary()

    def _get_cache_key(self, instance) -> str:
        """Generate a stable cache key for the instance.

        Args:
            instance: Django model instance

        Returns:
            str: Cache key for the instance
        """
        if instance.pk is not None:
            # For saved instances, use PK-based key (stable across app restarts)
            return f"pk_{instance.pk}_{instance._meta.label}"
        else:
            # For unsaved instances, use object id (only stable within process)
            return f"id_{id(instance)}"

    def _can_use_weak_cache(self, instance):
        """Check if instance can be used as WeakKeyDictionary key.

        Args:
            instance: Django model instance

        Returns:
            bool: True if instance can be weakly referenced
        """
        return instance.pk is not None

    def __get__(
        self,
        instance: models.Model | None,
        owner: type[models.Model],
    ) -> Self | ProsemirrorFieldDocument:
        """Get the ProsemirrorFieldDocument for the given instance.

        Args:
            instance: Django model instance or None
            owner: Model class

        Returns:
            ProsemirrorFieldDocument or ProsemirrorFieldDescriptor:
                Document wrapper for instance, or descriptor for class access
        """
        if instance is None:
            return self

        current_raw_value = cast(
            ProsemirrorDocument, instance.__dict__.get(self.field.attname)
        )

        cached_doc: None | ProsemirrorFieldDocument = None
        cache_key = self._get_cache_key(instance)

        # Try WeakKeyDictionary first for saved instances to ensure the cache for a
        # model instance is properly garbage collected...
        if (
            self._can_use_weak_cache(instance)
            and instance in self._saved_instance_cache
        ):
            cached_doc = self._saved_instance_cache[instance]

        # ... otherwise, check if the instance is in the unsaved instances cache
        elif cache_key in self._unsaved_instance_cache:
            cached_doc = self._unsaved_instance_cache[cache_key]

        # For instances that were recently saved, also check the old unsaved cache key:
        # this is to ensure that, if a document is initially assigned to an unsaved
        # instance and the instance is saved, the document retains its identity.
        elif self._can_use_weak_cache(instance):
            old_unsaved_key = f"id_{id(instance)}"
            if old_unsaved_key in self._unsaved_instance_cache:
                cached_doc = self._unsaved_instance_cache[old_unsaved_key]
                # Move cached document to saved cache and remove from unsaved cache
                self._saved_instance_cache[instance] = cached_doc
                self._unsaved_instance_cache.pop(old_unsaved_key, None)

        # If we have a cache hit, sync raw data and return it
        if cached_doc:
            if cached_doc._raw_data != current_raw_value:
                cached_doc._raw_data = current_raw_value

            return cached_doc

        # No cached document -- create a new document with the appropriate callback to
        # ensure mutations to the document are synced back to the model.
        #
        # We need to use a weakref here to ensure that sync_callback does not capture
        # the instance in a closure, preventing garbage collection of the document.
        instance_ref = weakref.ref(instance)
        field_attname = self.field.attname

        def sync_callback(new_raw_data):
            instance_obj = instance_ref()
            if instance_obj is not None:
                instance_obj.__dict__[field_attname] = new_raw_data

                # Mark the field as changed for Django's change tracking
                if hasattr(instance_obj, "_state") and hasattr(
                    instance_obj._state, "fields_cache"
                ):
                    instance_obj._state.fields_cache.pop(field_attname, None)

        new_doc = ProsemirrorFieldDocument(
            current_raw_value,
            sync_to_field_callback=sync_callback,
            schema=self.schema,
        )

        if self._can_use_weak_cache(instance):
            self._saved_instance_cache[instance] = new_doc
        else:
            self._unsaved_instance_cache[cache_key] = new_doc

            # Unsaved instances should be removed from the cache as soon as they are
            # garbage collected. Because unsaved instances are ephemeral, we don't have
            # to expect a future call with that specific instance.
            def cleanup_callback(_cache_key):
                self._unsaved_instance_cache.pop(_cache_key, None)

            weakref.finalize(instance, cleanup_callback, cache_key)

        return new_doc

    def __set__(self, instance, value):
        """Set the field value on the instance.

        Args:
            instance: Django model instance
            value: New value (can be ProsemirrorFieldDocument or raw data)
        """
        if isinstance(value, ProsemirrorFieldDocument):
            value = value.raw_data

        instance.__dict__[self.field.attname] = value

        # Update cached document if it exists in either cache
        if (
            self._can_use_weak_cache(instance)
            and instance in self._saved_instance_cache
        ):
            self._saved_instance_cache[instance]._raw_data = value
        else:
            cache_key = self._get_cache_key(instance)
            if cache_key in self._unsaved_instance_cache:
                self._unsaved_instance_cache[cache_key]._raw_data = value

        # Clear Django's field cache
        if hasattr(instance, "_state") and hasattr(instance._state, "fields_cache"):
            instance._state.fields_cache.pop(self.field.attname, None)

    def __delete__(self, instance):
        """Delete the field value from the instance.

        Args:
            instance: Django model instance
        """
        # Clean up both caches when field is deleted
        if self._can_use_weak_cache(instance):
            self._saved_instance_cache.pop(instance, None)

        cache_key = self._get_cache_key(instance)
        self._unsaved_instance_cache.pop(cache_key, None)

        if self.field.attname in instance.__dict__:
            del instance.__dict__[self.field.attname]


class ProsemirrorModelField(models.JSONField):
    """Django model field for storing Prosemirror rich text content.

    This field stores Prosemirror documents as JSON while providing
    convenient access to both document and HTML representations through
    a ProsemirrorFieldDocument wrapper.

    The field includes schema validation and supports seamless conversion
    between Prosemirror document format and HTML.
    """

    description = "Prosemirror content stored as JSON"
    schema: Schema
    allowed_node_types: list[NodeType] | None
    allowed_mark_types: list[MarkType] | None
    tag_to_classes: Mapping[str, str]
    history: bool | None

    def __init__(
        self,
        verbose_name: str | None = None,
        name: str | None = None,
        encoder: Any | None = None,
        decoder: Any | None = None,
        *,
        default: Callable[[], ProsemirrorDocument] | None = None,
        allowed_node_types: list[NodeType] | None = None,
        allowed_mark_types: list[MarkType] | None = None,
        tag_to_classes: Mapping[str, str] | None = None,
        history: bool | None = None,
        **kwargs: Any,  # type: ignore[misc]
    ):
        """Initialize the Prosemirror model field.

        Args:
            verbose_name: Human-readable name for the field
            name: Name of the field (usually auto-set by Django)
            encoder: JSON encoder (inherited from JSONField)
            decoder: JSON decoder (inherited from JSONField)
            default: Callable that returns default document data
            allowed_node_types: List of NodeType enums to allow
            allowed_mark_types: List of MarkType enums to allow
            tag_to_classes: Mapping of tag names to CSS classes
            **kwargs: Additional field options

        Raises:
            ValueError: If default is not callable
            ValidationError: If default callable returns invalid document
        """
        # Validate input types
        if allowed_node_types is not None and not isinstance(allowed_node_types, list):
            raise TypeError(
                "allowed_node_types must be a list of NodeType enums or None"
            )
        if allowed_mark_types is not None and not isinstance(allowed_mark_types, list):
            raise TypeError(
                "allowed_mark_types must be a list of MarkType enums or None"
            )

        self.allowed_node_types = allowed_node_types
        self.allowed_mark_types = allowed_mark_types
        self.tag_to_classes = tag_to_classes

        self.schema = SchemaFactory.create_schema(
            allowed_node_types=self.allowed_node_types,
            allowed_mark_types=self.allowed_mark_types,
            tag_to_classes=self.tag_to_classes,
        )
        self.history = history

        # Validate default callable if provided
        if default:
            if not callable(default):
                raise ValueError(f"`default` must be a callable, got {type(default)}")

            try:
                validate_doc(default(), schema=self.schema)
            except ValidationError:
                raise ValidationError(
                    "Your `default` callable returns a document that would be invalid "
                    " according to your schema."
                ) from None

        super().__init__(
            verbose_name,
            name,
            default=default,
            encoder=encoder,
            decoder=decoder,
            **kwargs,
        )

    def formfield(self, *args, **kwargs):
        defaults = {
            "form_class": ProsemirrorFormField,
            "allowed_node_types": self.allowed_node_types,
            "allowed_mark_types": self.allowed_mark_types,
            "tag_to_classes": self.tag_to_classes,
            "history": self.history,
        }
        defaults.update(kwargs)
        return super().formfield(*args, **defaults)

    def contribute_to_class(self, cls, name, private_only=False):
        super().contribute_to_class(cls, name, private_only=private_only)
        setattr(
            cls,
            name,
            ProsemirrorFieldDescriptor(self, schema=self.schema),
        )

    def get_prep_value(self, value):
        """Prepare value for database storage."""
        if isinstance(value, ProsemirrorFieldDocument):
            value = value.raw_data
        return super().get_prep_value(value)

    def value_to_string(self, obj):
        """Convert field value to string for serialization."""
        # For serialization (used by admin, fixtures, etc.)
        value = self.value_from_object(obj)
        if isinstance(value, ProsemirrorFieldDocument):
            value = value.raw_data

        return json.dumps(value, cls=self.encoder) if value is not None else ""

    def value_from_object(self, obj):
        """Get the raw field value from model instance."""
        raw_value = obj.__dict__.get(self.attname)
        return raw_value

    def validate(self, value, model_instance):
        _value = value
        if isinstance(value, ProsemirrorFieldDocument):
            _value = value.doc
        return super().validate(_value, model_instance)

    def __reduce__(self):
        # Use Django's deconstruct method which handles field serialization
        name, path, args, kwargs = self.deconstruct()
        return (self.__class__, args, kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs["tag_to_classes"] = self.tag_to_classes
        kwargs["allowed_node_types"] = self.allowed_node_types
        kwargs["allowed_mark_types"] = self.allowed_mark_types
        kwargs["history"] = self.history
        return name, path, args, kwargs


class ProsemirrorFormField(forms.JSONField):
    """Django form field for Prosemirror rich text content.

    This form field handles Prosemirror document validation and
    provides the appropriate widget for rendering the editor.
    """

    schema: Schema
    allowed_node_types: list[NodeType] | None
    allowed_mark_types: list[MarkType] | None
    tag_to_classes: Mapping[str, str]
    history: bool
    widget = ProsemirrorWidget

    def __init__(
        self,
        encoder=None,
        decoder=None,
        *,
        allowed_node_types: list[NodeType] | None = None,
        allowed_mark_types: list[MarkType] | None = None,
        tag_to_classes: Mapping[str, str] | None = None,
        history: bool = True,
        **kwargs: Any,  # type: ignore[misc]
    ):
        """Initialize the Prosemirror form field.

        Args:
            encoder: JSON encoder (inherited from JSONField)
            decoder: JSON decoder (inherited from JSONField)
            allowed_node_types: List of NodeType enums to allow
            allowed_mark_types: List of MarkType enums to allow
            tag_to_classes: Mapping of tag names to CSS classes
            **kwargs: Additional field options
        """
        # Validate input types
        if allowed_node_types is not None and not isinstance(allowed_node_types, list):
            raise TypeError(
                "allowed_node_types must be a list of NodeType enums or None"
            )
        if allowed_mark_types is not None and not isinstance(allowed_mark_types, list):
            raise TypeError(
                "allowed_mark_types must be a list of MarkType enums or None"
            )

        self.allowed_node_types = allowed_node_types
        self.allowed_mark_types = allowed_mark_types
        self.tag_to_classes = tag_to_classes

        self.schema = SchemaFactory.create_schema(
            allowed_node_types=self.allowed_node_types,
            allowed_mark_types=self.allowed_mark_types,
            tag_to_classes=self.tag_to_classes,
        )
        self.history = history
        kwargs["widget"] = self.widget(
            allowed_node_types=self.allowed_node_types,
            allowed_mark_types=self.allowed_mark_types,
            tag_to_classes=self.tag_to_classes,
            history=self.history,
        )
        super().__init__(encoder, decoder, **kwargs)

    def to_python(self, value) -> ProsemirrorFieldDocument:
        """Convert form input to Python representation."""
        python_value = super().to_python(value)
        return ProsemirrorFieldDocument(python_value, schema=self.schema)

    def validate(self, value):
        """Validate the form field value."""
        if not isinstance(value, ProsemirrorFieldDocument):
            raise ValueError(
                f"Expected {ProsemirrorFieldDocument.__name__}, got {type(value)}"
            )

        super().validate(value.doc)
        if value.doc is not None:
            validate_doc(value.doc, schema=self.schema)
