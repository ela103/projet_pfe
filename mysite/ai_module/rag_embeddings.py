import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from .rag_builder import build_rag_documents


_RAG_CACHE = {}

# Modèle local d'embeddings
model = SentenceTransformer("all-MiniLM-L6-v2")


def clear_rag_cache(website_id=None):
    if website_id is None:
        _RAG_CACHE.clear()
    else:
        _RAG_CACHE.pop(str(website_id), None)


def get_cached_documents(website_id=None):
    cache_key = str(website_id)

    if cache_key not in _RAG_CACHE:
        documents = build_rag_documents(website_id)
        texts = [doc["text"] for doc in documents]

        if not texts:
            _RAG_CACHE[cache_key] = {
                "documents": [],
                "embeddings": None,
            }
        else:
            embeddings = model.encode(texts, normalize_embeddings=True)

            _RAG_CACHE[cache_key] = {
                "documents": documents,
                "embeddings": embeddings,
            }

    return _RAG_CACHE[cache_key]


def retrieve_relevant_documents(question, website_id=None, top_k=5):
    print("RAG avec embeddings activé")
    rag_data = get_cached_documents(website_id)

    documents = rag_data["documents"]
    embeddings = rag_data["embeddings"]

    if not documents or embeddings is None:
        return []

    question_embedding = model.encode(
        [question],
        normalize_embeddings=True
    )

    similarities = cosine_similarity(question_embedding, embeddings)[0]
    top_indices = np.argsort(similarities)[::-1][:top_k]

    relevant_docs = []

    for index in top_indices:
        if similarities[index] > 0.30:
            relevant_docs.append({
                "score": round(float(similarities[index]), 3),
                "type": documents[index]["type"],
                "text": documents[index]["text"],
            })

    return relevant_docs