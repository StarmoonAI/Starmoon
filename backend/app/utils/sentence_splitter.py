import nltk


def chunk_text_by_clause(text):
    return nltk.sent_tokenize(text)
