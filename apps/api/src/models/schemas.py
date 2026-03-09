from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class Figure(str, Enum):
    machiavelli = "machiavelli"
    socrates = "socrates"
    epictetus = "epictetus"
    mill = "mill"
    aurelius = "aurelius"
    locke = "locke"
    rousseau = "rousseau"
    nietzsche = "nietzsche"
    hobbes = "hobbes"
    plato = "plato"
    aristotle = "aristotle"
    hume = "hume"
    kant = "kant"
    wollstonecraft = "wollstonecraft"
    marx = "marx"
    thoreau = "thoreau"
    seneca = "seneca"
    cicero = "cicero"
    lucretius = "lucretius"
    descartes = "descartes"
    spinoza = "spinoza"
    leibniz = "leibniz"
    voltaire = "voltaire"
    paine = "paine"
    burke = "burke"
    douglass = "douglass"
    emerson = "emerson"
    dubois = "dubois"
    darwin = "darwin"
    james = "james"
    tocqueville = "tocqueville"
    russell = "russell"


class DebateMode(str, Enum):
    structured = "structured"
    freeform = "freeform"
    socratic = "socratic"


class DebateTopic(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    prompt_hint: Optional[str] = None


class FigureInfo(BaseModel):
    id: str
    name: str
    era: str
    description: str
    works: list[str]
    topics: list[DebateTopic]
    traits: list[str]


class Message(BaseModel):
    role: str
    content: str
    timestamp: float


class Passage(BaseModel):
    """Excerpt from a source used in the debate."""

    source_id: str
    title: str
    text_excerpt: str


class DebateTurn(BaseModel):
    turn_number: int
    user_argument: str
    figure_response: str
    sources_used: list[str]
    passages: list[Passage] = []
    scores: Optional[dict] = None
    scores_error: Optional[str] = None  # When scoring parse failed
    key_claims: list[
        str
    ] = []  # Key claims from figure's response for rebuttal challenge


class DebateState(BaseModel):
    id: str
    figure: Figure
    topic: str
    topic_id: Optional[str] = None
    mode: DebateMode
    max_turns: int
    current_turn: int
    turns: list[DebateTurn]
    created_at: float
    status: str = "active"
    opening_statement: Optional[str] = None


class StartDebateRequest(BaseModel):
    figure: Figure
    topic_id: str = Field(..., min_length=1, max_length=100)
    mode: DebateMode = DebateMode.socratic
    max_turns: int = Field(default=3, ge=1, le=10)


class SubmitArgumentRequest(BaseModel):
    debate_id: str = Field(..., min_length=1, max_length=100)
    argument: str = Field(..., min_length=1, max_length=2000)


class ScoreResult(BaseModel):
    logic_score: int
    historical_accuracy_score: int
    rhetoric_score: int
    rebuttal_score: int
    strengths: list[str]
    improvements: list[str]
    source_used_well: bool
