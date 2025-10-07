import json

import ollama

from prompts import SPELL_GENERATOR_SYSTEM_PROMPT, WIZARD_GENERATOR_SYSTEM_PROMPT
from schemas import SPELL_GENERATION_SCHEMA, WIZARD_GENERATION_SCHEMA, ACTION_CHOICE_SCHEMA

MODEL = "llama3.2"


def generate_wizard_stats(user_prompt: str) -> dict:
    messages = [
        {"role": "system", "content": WIZARD_GENERATOR_SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    response = ollama.chat(
        model=MODEL,
        messages=messages,
        format=WIZARD_GENERATION_SCHEMA,
        options={
            "temperature": 0.65,        # lively but not chaotic
            "top_p": 0.92,             # trims tail tokens while keeping variety
            "min_p": 0.07,
            "mirostat": 0,             # turn off for better schema reliability
            "repeat_penalty": 1.1,     # reduce rambling / repeats
            "repeat_last_n": 128,
            "num_ctx": 3000,           # plenty for your system prompt + few-shots
            "num_predict": 220,
            "keep_alive": "10m",
        },
    )
    return json.loads(response.get("message", {}).get("content"))


def generate_spells(description: str, name: str, primary_element: str, secondary_element: str, combat_style: str) -> list[dict]:
    spell_prompt = (
        f"wizard_description: {description}\n"
        f"combat_style: {combat_style}\n"
        f"primary_element: {primary_element}\n"
        f"secondary_element: {secondary_element}"
    )
    messages = [
        {"role": "system", "content": SPELL_GENERATOR_SYSTEM_PROMPT},
        {"role": "user", "content": spell_prompt},
    ]
    response = ollama.chat(
        model=MODEL,
        messages=messages,
        format=SPELL_GENERATION_SCHEMA,
        options={
            "temperature": 0.65,
            "num_predict": 315,
            "repeat_penalty": 1.1,     # reduce rambling / repeats
            "repeat_last_n": 128,
            "stop": ["<END>"],
            "top_p": 0.92,
            "min_p": 0.07,
            "num_ctx": 3000,           # plenty for your system prompt + few-shots
            "keep_alive": "10m",
        },
    )
    return json.loads(response.get("message", {}).get("content"))

def generate_action_choice(system_prompt: str, 
                            user_prompt: str) -> dict:
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    response = ollama.chat(
        model=MODEL,
        messages=messages,
        format=ACTION_CHOICE_SCHEMA,
        options={
            "temperature": 0.4,
            "num_predict": 200,
            "top_p": 0.9,
            "top_k": 40,
            "keep_alive": "10m"
        }
    )
    return json.loads(response.get("message", {}).get("content"))