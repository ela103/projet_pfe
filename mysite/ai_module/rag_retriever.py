import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .rag_builder import build_rag_documents


_RAG_CACHE = {}


def clear_rag_cache(website_id=None):
    if website_id is None:
        _RAG_CACHE.clear()
    else:
        _RAG_CACHE.pop(website_id, None)


def get_cached_documents(website_id=None):
    cache_key = str(website_id)

    if cache_key not in _RAG_CACHE:
        documents = build_rag_documents(website_id)
        texts = [doc["text"] for doc in documents]

        if not texts:
            _RAG_CACHE[cache_key] = {
                "documents": [],
                "vectorizer": None,
                "matrix": None,
            }
        else:
            vectorizer = TfidfVectorizer()
            matrix = vectorizer.fit_transform(texts)

            _RAG_CACHE[cache_key] = {
                "documents": documents,
                "vectorizer": vectorizer,
                "matrix": matrix,
            }

    return _RAG_CACHE[cache_key]


def retrieve_relevant_documents(question, website_id=None, top_k=5):
    rag_data = get_cached_documents(website_id)

    documents = rag_data["documents"]
    vectorizer = rag_data["vectorizer"]
    matrix = rag_data["matrix"]

    if not documents or vectorizer is None or matrix is None:
        return []

    question_vector = vectorizer.transform([question])
    similarities = cosine_similarity(question_vector, matrix)[0]

    top_indices = np.argsort(similarities)[::-1][:top_k]

    relevant_docs = []

    for index in top_indices:
        if similarities[index] > 0:
            relevant_docs.append({
                "score": round(float(similarities[index]), 3),
                "type": documents[index]["type"],
                "text": documents[index]["text"],
            })

    return relevant_docs