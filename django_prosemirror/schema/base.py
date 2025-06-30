"""Base classes and utilities for schema definitions."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from prosemirror.model.schema import MarkSpec, NodeSpec


@dataclass
class ClassMapping:
    """Encapsulates CSS class configuration with defaults and fallbacks."""

    classes: dict[str, str]

    def get(self, key: str, default: str = "") -> str:
        """Get class for a key, falling back to default."""
        return self.classes.get(key, default)

    def apply_to_attrs(self, attrs: dict, key: str) -> dict:
        """Apply class to attributes dict if class exists."""
        class_name = self.get(key)
        if class_name:
            attrs = attrs.copy() if attrs else {}
            attrs["class"] = class_name
            return attrs
        return attrs if attrs else {}


class NodeDefinition(ABC):
    """Base class for node definitions."""

    def __init__(self, class_mapping: ClassMapping):
        """Initialize node with class mapping."""
        self.class_mapping = class_mapping

    @property
    @abstractmethod
    def name(self) -> str:
        """The name of this node type."""
        ...

    @property
    @abstractmethod
    def spec(self) -> NodeSpec:
        """Get the NodeSpec for this node."""
        ...

    @abstractmethod
    def to_dom(self, node: Any) -> list[str | dict[str, Any] | int]:
        """Convert node to DOM representation."""
        ...

    @abstractmethod
    def dom_matcher(self) -> list[dict[str, Any]]:
        """Return DOM parsing rules for this node."""
        ...


class MarkDefinition(ABC):
    """Base class for mark definitions."""

    def __init__(self, class_mapping: ClassMapping):
        """Initialize mark with class mapping."""
        self.class_mapping = class_mapping

    @property
    @abstractmethod
    def name(self) -> str:
        """The name of this mark type."""
        ...

    @property
    @abstractmethod
    def spec(self) -> MarkSpec:
        """Get the MarkSpec for this mark."""
        ...

    @abstractmethod
    def to_dom(self, mark: Any, inline: bool) -> list[str | dict[str, Any] | int]:
        """Convert mark to DOM representation."""
        ...

    @abstractmethod
    def dom_matcher(self) -> list[dict[str, Any]]:
        """Return DOM parsing rules for this mark."""
        ...
