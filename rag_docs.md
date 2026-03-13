# Retrieval-Augmented Generation (RAG): Taxonomy and Project Architecture

Retrieval-Augmented Generation (RAG) is a framework that improves the quality, accuracy, and factuality of Large Language Models (LLMs) by grounding their responses in external, explicitly retrieved knowledge bases. This document outlines the evolution and taxonomy of RAG systems in the industry and provides a detailed analysis of the RAG architecture implemented in this project.

## 1. RAG Taxonomy in Practice

Recent surveys and industry practices (Gao et al., 2024; Asai et al., 2023) categorize RAG systems into several evolutionary stages based on their complexity and the sophistication of their retrieval and generation processes.

### 1.1. Naive RAG (Basic RAG)

Naive RAG represents the foundational implementation of the RAG framework.

- **Mechanism:** It follows a straightforward "Retrieve-Then-Read" paradigm. Documents are chunked, embedded into a vector space, and stored in a Vector Database. When a user asks a query, the system converts the query into a vector, performs a semantic similarity search (usually k-Nearest Neighbors or Cosine Similarity), retrieves the top-$k$ most similar chunks, and feeds them directly into the LLM context window alongside the prompt to generate an answer.
- **Limitations:** This approach suffers from low precision (retrieving irrelevant chunks), low recall (failing to retrieve all relevant information), and "hallucinations" if the retrieved context is contradictory or loosely related. It also struggles to handle complex queries that require synthesizing information from multiple distinct documents.

### 1.2. Advanced RAG

Advanced RAG builds upon the naive framework by introducing sophisticated pre-retrieval and post-retrieval optimization strategies to enhance context relevance and generation quality.

- **Pre-retrieval:** Techniques include **Query Rewriting** (rephrasing the user's query for better retrieval), **Query Expansion** (generating synonyms or sub-queries), and **Query Routing** (directing queries to the most appropriate data source).
- **Post-retrieval:** Involves **Reranking** (using a cross-encoder model to re-score and re-order retrieved documents based on actual relevance to the query, rather than just vector proximity) and **Context Compression** (extracting only the most relevant sentences from retrieved chunks to fit within LLM context limits and reduce noise).

### 1.3. Modular RAG

Modular RAG represents a highly flexible architectural paradigm where RAG is no longer a linear pipeline but a system composed of interchangeable and configurable modules.

- **Mechanism:** It allows for integrating specialized modules such as a Search Module (for traditional web search engines), Memory Modules, or routing mechanisms. The retrieval and generation steps can be executed iteratively or in a unified manner depending on the task.

### 1.4. Hybrid RAG

Hybrid RAG addresses the fundamental limitation of pure Vector Search, which relies on semantic similarity but often fails at exact keyword matching (e.g., specific product IDs, acronyms, or proper nouns).

- **Mechanism:** It combines **Dense Retrieval** (semantic vector search) with **Sparse Retrieval** (lexical/keyword search, such as BM25 or full-text SQL search). The results from both retrieval engines are merged using fusion algorithms like Reciprocal Rank Fusion (RRF) or custom weighted scoring to provide a candidate list that is both semantically relevant and lexically precise.

### 1.5. Graph RAG

Graph RAG leverages Knowledge Graphs (KGs) to represent complex relationships between entities, providing structured context that LLMs can use for multi-hop reasoning.

- **Mechanism:** Instead of retrieving unstructured text chunks, Graph RAG extracts entity sub-graphs relevant to the query. This is particularly effective for answering questions that require connecting disparate pieces of information distributed across a vast dataset.

### 1.6. Agentic RAG / Self-Reflective RAG

These represent the bleeding edge of RAG technology, where the system possesses autonomy or self-correction capabilities.

- **Mechanism (Self-RAG):** The LLM is trained to dynamically decide _whether_ to retrieve information, _critique_ the retrieved passages for relevance, and _verify_ its own generated output against the retrieved facts using special "reflection tokens".

---

## 2. RAG Architecture in This Project

Based on the implementation in `server/src/services/hybrid-rag.service.ts`, this project utilizes a highly sophisticated **Advanced Hybrid RAG** architecture. It intentionally bypasses the Naive RAG approach in favor of a structured, multi-layered retrieval pipeline tailored specifically for an e-commerce/restaurant domain.

The RAG system is divided into two distinct pipelines depending on the target dataset:

### 2.1. Full Menu Search (5-Layer Production Pipeline)

This is an Advanced Hybrid RAG implementation featuring **3-way retrieval** and custom post-retrieval reranking.

1.  **Layer 1: Normalize (Pre-retrieval):**
    - Detects the language of the query (Vietnamese, Russian, or English) using heuristics and diacritic detection.
    - Normalizes the text string for downstream processing, removing noise.
2.  **Layer 2: Entity Extraction (Pre-retrieval Structuring):**
    - _Query Understanding:_ Extracts highly structured domain-specific entities from the raw query using predefined dictionaries (`tasteDictionary`, `ingredientDictionary`, `allergenPhrases`).
    - Specifically looks for categories, ingredients, tastes, and importantly, **allergen exclusions** (e.g., detecting "no peanuts" to dynamically filter results).
3.  **Layer 3: Query Expansion (Optimization Module):**
    - Expands the user query using a synonym map (`synonyms.json`) to increase semantic recall (e.g., mapping slang or colloquial terms to official menu names).
    - Implements **Catalog Expansion** by checking if the query matches a menu category, and if so, systematically expanding the query to include top dishes within that category.
    - Assigns specific weights to expanded terms (`ORIGINAL`: 1.0, `SYNONYM`: 0.8, `CATALOG`: 0.7) for downstream scoring.
4.  **Layer 4: Hybrid Retrieval (Dense + Sparse/Structured):**
    - _Vector Search (Dense):_ Utilizes an Embedding Service and ChromaDB to find semantically similar dishes (`vectorSearch`).
    - _SQL Search (Sparse/Keyword):_ Performs an exact/partial text match query against the Prisma PostgreSQL database using the expanded query terms (`sqlSearchWithExpansion`).
    - _Structured Filter:_ Acts as a deterministic semantic filter based on the extracted entities from Layer 2. Notably, it performs in-memory filtering to enforce strict allergen exclusions, overriding simple vector similarities (a critical feature for food service platforms).
5.  **Layer 5: Merge + Rerank + Log (Post-retrieval):**
    - Implements a custom algorithmic scoring mechanism substituting a traditional LLM Cross-Encoder reranker for latency efficiency.
    - Scores are calculated based on origin (`SQL_EXACT_NAME` receives the highest base score, `FILTER_MATCH` receives a competitive score, and Vector results are scored inversely by their cosine distance).
    - Applies a `MULTI_SOURCE_BONUS` if a document is retrieved by multiple distinct search strategies (e.g., both Vector and Structured Filter), significantly boosting its absolute rank.

### 2.2. FAQ Search (Lightweight 4-Layer Pipeline)

For simpler informational queries, the system employs a lighter weight Hybrid RAG pipeline with **2-way retrieval**.

1.  **Layer 1: Normalize:** Standardizes text and identifies the primary language.
2.  **Layer 2: Light Expansion:** Only applies synonym expansion if the query is extremely short ($\le 3$ words), preventing semantic drift on detailed questions.
3.  **Layer 3: Hybrid Retrieval:**
    - Executes parallel searches to Prisma SQL (searching `question` and `answer` columns) and ChromaDB (`restaurant_faq` embedding collection).
4.  **Layer 4: Simple Rerank:**
    - Merges and deduplicates results, assigning a base score for exact SQL matches and distance-based scores for vector matches. Applies a 30-point scoring bonus if a single FAQ item is retrieved by both engines independently.

### Summary Conclusion

This project implements a state-of-the-art **Domain-Specific Advanced Hybrid RAG** architecture. By decoupling the monolithic retrieval phase into structured entity extraction, dense semantic vector search, and strict SQL keyword filtering, it successfully mitigates the primary limitations of Naive RAG (hallucinations and poor keyword recall) while maintaining robust semantic understanding. The inclusion of deterministic pre-filters (such as allergen exclusion processing) prior to the generation phase ensures high factual reliability, safety, and operational precision suitable for production deployment.
