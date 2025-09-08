# backend/email_ai/ai/spam_detection/infer.py
from pathlib import Path
import pickle
import re
from typing import List, Dict, Any

from keras.models import load_model
from keras.preprocessing.sequence import pad_sequences

HERE = Path(__file__).resolve().parent
MODEL_PATH = HERE / "model_spam.keras"
TOK_PATH   = HERE / "tokenizer_spam.pkl"
MAX_LEN    = 150


def _load_tokenizer(path: Path):
    with open(path, "rb") as f:
        obj = pickle.load(f)

    # Expects: {"tokenizer": <Tokenizer object>, ...}
    if isinstance(obj, dict) and "tokenizer" in obj:
        tokenizer = obj["tokenizer"]
        if hasattr(tokenizer, "texts_to_sequences"):
            return tokenizer

    raise TypeError(
        f"Invalid tokenizer file: {path.name}. Expected a dict with a 'tokenizer' key pointing to a Keras Tokenizer object."
    )


class SpamClassifier:
    _instance = None

    def __init__(self) -> None:
        if not MODEL_PATH.exists() or not TOK_PATH.exists():
            raise FileNotFoundError(f"Missing artifacts:\n- {MODEL_PATH}\n- {TOK_PATH}")
        self.tokenizer = _load_tokenizer(TOK_PATH)
        self.model = load_model(str(MODEL_PATH))

    @classmethod
    def get(cls) -> "SpamClassifier":
        if cls._instance is None:
            cls._instance = SpamClassifier()
        return cls._instance

    def predict_proba(self, texts: List[str]) -> List[float]:
        seqs = self.tokenizer.texts_to_sequences([t or "" for t in texts])
        X = pad_sequences(seqs, maxlen=MAX_LEN, padding="post", truncating="post")
        probs = self.model.predict(X, verbose=0).reshape(-1).tolist()
        return [float(p) for p in probs]

def score_messages(texts: List[str], threshold: float = 0.5):
    clf = SpamClassifier.get()
    probs = clf.predict_proba(texts)
    return [{"score": p, "label": ("spam" if p >= threshold else "ham")} for p in probs]
