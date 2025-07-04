"""Mark definitions for ProseMirror schema."""

from .code import CodeMark
from .italic import ItalicMark
from .link import LinkMark
from .strikethrough import StrikethroughMark
from .strong import StrongMark
from .underline import UnderlineMark

__all__ = [
    "CodeMark",
    "ItalicMark",
    "LinkMark",
    "StrikethroughMark",
    "StrongMark",
    "UnderlineMark",
]
