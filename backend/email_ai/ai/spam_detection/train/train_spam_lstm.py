# train_spam_lstm.py  (minimal changes)
import os, pickle
from pathlib import Path
import pandas as pd
from keras_preprocessing.text import Tokenizer
from keras_preprocessing.sequence import pad_sequences
from keras.models import Sequential
from keras.layers import Input, Embedding, LSTM, GlobalMaxPooling1D, Dense, Dropout
from keras.callbacks import EarlyStopping

# --- paths ---
HERE = Path(__file__).resolve()
DATA_CSV = HERE.parents[1] / "data" / "spam.csv"     # ../data/spam.csv
SAVE_DIR = HERE.parents[1]                            # -> ai/spam_detection/

# ---- LOAD DATA ----
dataset = pd.read_csv(DATA_CSV, usecols=[0, 1], encoding="ISO-8859-1")  # columns: labels, data
dataset["labels"] = dataset["labels"].str.strip()
dataset["labels"] = dataset["labels"].map({"not spam": 0, "spam": 1})

sentences = dataset["data"].values
labels = dataset["labels"].values

# ---- SPLIT ----
training_size = int(0.7 * len(sentences))
training_sentences = sentences[:training_size]
testing_sentences  = sentences[training_size:]
training_labels    = labels[:training_size]
testing_labels     = labels[training_size:]

# ---- TOKENIZE/PAD ----
tokenizer = Tokenizer(num_words=10000)
tokenizer.fit_on_texts(training_sentences)
vocabulary = len(tokenizer.word_index)

train_sequences = tokenizer.texts_to_sequences(training_sentences)
test_sequences  = tokenizer.texts_to_sequences(testing_sentences)

padded_train = pad_sequences(train_sequences)   # pad to max len in train
length_of_sequence = padded_train.shape[1]
padded_test  = pad_sequences(test_sequences, maxlen=length_of_sequence)

# ---- MODEL ----
model = Sequential()
model.add(Input(shape=(length_of_sequence,)))
model.add(Embedding(vocabulary + 1, 20))
model.add(LSTM(15, return_sequences=True))
model.add(Dropout(0.5))
model.add(GlobalMaxPooling1D())
model.add(Dense(1, activation="sigmoid"))
model.compile(loss="binary_crossentropy", optimizer="adam", metrics=["accuracy"])

# ---- TRAIN ----
EPOCHS = 10
model.fit(
    padded_train, training_labels,
    epochs=EPOCHS,
    validation_data=(padded_test, testing_labels),
    callbacks=[EarlyStopping(monitor="val_loss", patience=3, restore_best_weights=True)],
    verbose=1
)

# ---- SAVE ARTIFACTS ----
TOKENIZER_NAME = "tokenizer_spam.pkl"
MODEL_NAME     = "model_spam.keras"

with open(SAVE_DIR / TOKENIZER_NAME, "wb") as f:
    pickle.dump({"tokenizer": tokenizer, "maxlen": length_of_sequence, "num_words": 10000}, f)

model.save(SAVE_DIR / MODEL_NAME)
print(f"Saved: {(SAVE_DIR / MODEL_NAME)} and {(SAVE_DIR / TOKENIZER_NAME)}")
