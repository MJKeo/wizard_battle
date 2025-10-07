#!/usr/bin/env python3

"""
All schema definitions
"""

WIZARD_GENERATION_SCHEMA = {
  "type": "object",
  "properties": {
    "name": {"type": "string"},
    "primary_element":{"type": "string", "enum": ["FIRE","ICE","STORM","LIFE","DEATH","MYTH","BALANCE"]},
    "secondary_element":{"type": "string", "enum": ["FIRE","ICE","STORM","LIFE","DEATH","MYTH","BALANCE"]},
    "attack": {"type": "number", "minimum": 0, "maximum": 1},
    "defense": {"type": "number", "minimum": 0, "maximum": 1},
    "health": {"type": "number", "minimum": 0, "maximum": 1},
    "healing": {"type": "number", "minimum": 0, "maximum": 1},
    "arcane": {"type": "number", "minimum": 0, "maximum": 1},
    "combat_style": {"type": "string"},
  },
  "required": ["name","primary_element","secondary_element","attack","defense","health","healing","arcane","combat_style"],
  "additionalProperties": False
}

SPELL_GENERATION_SCHEMA = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "name":   {"type": "string"},
            "description":   {"type": "string"},
            "spell_type": {"type": "string", "enum": ["DAMAGE","DEBUFF","BUFF"]},
            "element":{"type": "string", "enum": ["FIRE","ICE","STORM","LIFE","DEATH","MYTH","BALANCE"]},
            "strength":{"type": "number", "minimum": 0, "maximum": 1.0}
        },
        "required": ["name","description","spell_type","element","strength"],
        "additionalProperties": False
    }
}

ACTION_CHOICE_SCHEMA = {
    "type": "object",
    "properties": {
        "action_index": {
            "type": "integer",
            "minimum": 0
        },
        "justification": {
            "type": "string"
        }
    },
    "required": ["action_index", "justification"],
    "additionalProperties": False
}