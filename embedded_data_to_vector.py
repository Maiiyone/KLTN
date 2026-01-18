import json
import os
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple


def _load_optional_dotenv() -> None:
    try:
        # Load .env if available; ignore if missing
        from dotenv import load_dotenv  # type: ignore

        load_dotenv()
    except Exception:
        pass


@dataclass
class EmbedConfig:
    json_path: str
    collection_name: str
    embedder_type: str = "local"  # "local" | "openai"
    model_name: Optional[str] = None
    batch_size: int = 128
    # Qdrant params
    qdrant_url: Optional[str] = None
    qdrant_host: Optional[str] = None
    qdrant_port: Optional[int] = None
    qdrant_api_key: Optional[str] = None
    distance: str = "Cosine"  # "Cosine" | "Dot" | "Euclid"


class TextEmbedder:
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        raise NotImplementedError

    @property
    def dimension(self) -> int:
        raise NotImplementedError


class LocalSentenceTransformerEmbedder(TextEmbedder):
    def __init__(self, model_name: Optional[str] = None) -> None:
        from sentence_transformers import SentenceTransformer  # type: ignore

        self._model_name = model_name or "sentence-transformers/all-MiniLM-L6-v2"
        self._model = SentenceTransformer(self._model_name)
        # Infer dimension via single forward; cached for reuse
        self._dimension: Optional[int] = None

    @property
    def dimension(self) -> int:
        if self._dimension is None:
            vec = self.embed_texts(["dim probe"])[0]
            self._dimension = len(vec)
        return self._dimension

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        embeddings = self._model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return embeddings.tolist()


class OpenAIEmbedder(TextEmbedder):
    def __init__(self, model_name: Optional[str] = None, api_key: Optional[str] = None) -> None:
        try:
            from openai import OpenAI  # type: ignore
        except Exception as exc:  # pragma: no cover - dependency optional
            raise RuntimeError("openai package is required for OpenAI embedder") from exc

        key = api_key or os.getenv("OPENAI_API_KEY")
        if not key:
            raise RuntimeError("OPENAI_API_KEY is not set")

        self._client = OpenAI(api_key=key)
        self._model_name = model_name or "text-embedding-3-small"  # 1536 dims
        self._dimension = 1536 if "small" in self._model_name else 3072

    @property
    def dimension(self) -> int:
        return self._dimension

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        # Chunk calls if necessary to avoid large payloads
        max_batch = 2048
        results: List[List[float]] = []
        for i in range(0, len(texts), max_batch):
            chunk = texts[i : i + max_batch]
            response = self._client.embeddings.create(model=self._model_name, input=chunk)
            results.extend([d.embedding for d in response.data])
        return results


class GeminiEmbedder(TextEmbedder):
    def __init__(self, model_name: Optional[str] = None, api_key: Optional[str] = None) -> None:
        try:
            import google.generativeai as genai  # type: ignore
        except Exception as exc:  # pragma: no cover
            raise RuntimeError("google-generativeai package is required for Gemini embedder") from exc

        key = api_key or os.getenv("GOOGLE_API_KEY")
        if not key:
            raise RuntimeError("GOOGLE_API_KEY is not set")
        genai.configure(api_key=key)

        # Default embedding model
        # text-embedding-004: 768 dims (recommended)
        self._model_name = model_name or "text-embedding-004"
        # Known dims for common Gemini embedding models
        self._dimension = 768 if self._model_name == "text-embedding-004" else 768
        self._genai = genai

    @property
    def dimension(self) -> int:
        return self._dimension

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        # Gemini API processes texts individually; batch manually
        out: List[List[float]] = []
        for text in texts:
            result = self._genai.embed_content(
                model=self._model_name,
                content=text,
                task_type="retrieval_document"
            )
            # Response structure: result['embedding'] is the vector
            if isinstance(result, dict) and "embedding" in result:
                out.append(result["embedding"])
            else:
                # For newer SDK versions with typed response
                embedding = getattr(result, "embedding", None)
                if embedding is not None:
                    out.append(embedding)
                else:
                    raise RuntimeError(f"Unexpected Gemini response format: {type(result)}")
        return out


def build_embedder(embedder_type: str, model_name: Optional[str]) -> TextEmbedder:
    et = embedder_type.lower().strip()
    if et == "local":
        return LocalSentenceTransformerEmbedder(model_name=model_name)
    if et == "openai":
        return OpenAIEmbedder(model_name=model_name)
    if et == "gemini":
        return GeminiEmbedder(model_name=model_name)
    raise ValueError(f"Unsupported embedder_type: {embedder_type}")


def read_products(json_path: str) -> List[Dict[str, Any]]:
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("Expected a JSON array at root")
    return data


def render_product_text(product: Dict[str, Any]) -> str:
    title = product.get("title") or product.get("product_name") or ""
    price_text = product.get("current_price_text") or ""
    unit = product.get("unit") or ""
    category_hint = product.get("product_url") or ""
    fields = [title, price_text, unit, category_hint]
    normalized = [str(x).strip() for x in fields if x]
    return " | ".join(normalized)


def build_points(
    products: List[Dict[str, Any]],
    embeddings: List[List[float]],
) -> List[Dict[str, Any]]:
    points: List[Dict[str, Any]] = []
    for product, vector in zip(products, embeddings):
        point_id = product.get("product_id") or product.get("product_code")
        
        # Qdrant requires unsigned int or UUID; convert to int
        if point_id is None:
            # Fallback to hashed text if no id fields
            point_id = abs(hash(render_product_text(product)))
        else:
            # Try to parse as int; if fails, hash it
            try:
                point_id = int(point_id)
            except (ValueError, TypeError):
                # Not a number, hash the string
                point_id = abs(hash(str(point_id)))
        
        # Ensure positive unsigned integer
        point_id = abs(int(point_id))
        
        points.append(
            {
                "id": point_id,
                "vector": vector,
                "payload": {
                    "product_id": product.get("product_id"),
                    "product_code": product.get("product_code"),
                    "title": product.get("title"),
                    "product_name": product.get("product_name"),
                    "current_price": product.get("current_price"),
                    "current_price_text": product.get("current_price_text"),
                    "unit": product.get("unit"),
                    "product_url": product.get("product_url"),
                    "image_url": product.get("image_url"),
                    "text": render_product_text(product),
                },
            }
        )
    return points


def ensure_qdrant_collection(
    client: "QdrantClient",  # type: ignore[name-defined]
    collection_name: str,
    vector_size: int,
    distance: str,
) -> None:
    from qdrant_client.http import models as qmodels  # type: ignore
    from qdrant_client.http.exceptions import UnexpectedResponse  # type: ignore

    metric_map = {
        "cosine": qmodels.Distance.COSINE,
        "dot": qmodels.Distance.DOT,
        "euclid": qmodels.Distance.EUCLID,
    }
    metric = metric_map.get(distance.lower(), qmodels.Distance.COSINE)

    try:
        info = client.get_collection(collection_name)
        current_vectors = info.config.params.vectors
        if hasattr(current_vectors, "size"):
            current_size = current_vectors.size  # type: ignore[attr-defined]
        else:
            # VectorParamsMap case; not expected for simple use
            current_size = None
        
        if current_size is not None and int(current_size) != int(vector_size):
            print(f"⚠️  Collection '{collection_name}' exists with size {current_size}, recreating with size {vector_size}...")
            client.recreate_collection(
                collection_name=collection_name,
                vectors_config=qmodels.VectorParams(size=vector_size, distance=metric),
            )
            print(f"✅ Collection '{collection_name}' recreated successfully")
        else:
            print(f"✅ Collection '{collection_name}' already exists with correct size {vector_size}")
    except (UnexpectedResponse, Exception) as e:
        print(f"📦 Creating new collection '{collection_name}' with size {vector_size}...")
        client.recreate_collection(
            collection_name=collection_name,
            vectors_config=qmodels.VectorParams(size=vector_size, distance=metric),
        )
        print(f"✅ Collection '{collection_name}' created successfully")


def upsert_points(
    client: "QdrantClient",  # type: ignore[name-defined]
    collection_name: str,
    points: List[Dict[str, Any]],
    batch_size: int,
) -> None:
    from qdrant_client import models as rest  # type: ignore

    total_batches = (len(points) + batch_size - 1) // batch_size
    print(f"🚀 Upserting {len(points)} points in {total_batches} batches...")
    
    for batch_idx, i in enumerate(range(0, len(points), batch_size), start=1):
        batch = points[i : i + batch_size]
        client.upsert(
            collection_name=collection_name,
            points=[
                rest.PointStruct(id=p["id"], vector=p["vector"], payload=p["payload"]) for p in batch
            ],
            wait=True,
        )
        print(f"  ✓ Batch {batch_idx}/{total_batches} ({len(batch)} points) upserted")
    
    print(f"✅ All {len(points)} points upserted successfully!")


def create_qdrant_client(cfg: EmbedConfig) -> "QdrantClient":  # type: ignore[name-defined]
    from qdrant_client import QdrantClient  # type: ignore

    if cfg.qdrant_url:
        return QdrantClient(url=cfg.qdrant_url, api_key=cfg.qdrant_api_key)
    host = cfg.qdrant_host or os.getenv("QDRANT_HOST", "localhost")
    port_env = cfg.qdrant_port or int(os.getenv("QDRANT_PORT", "6333"))
    return QdrantClient(host=host, port=port_env, api_key=cfg.qdrant_api_key)


def run_pipeline(cfg: EmbedConfig) -> Tuple[int, int]:
    _load_optional_dotenv()

    print("=" * 60)
    print("🔥 EMBEDDING PIPELINE STARTED")
    print("=" * 60)
    
    print(f"\n📖 Step 1: Reading products from {cfg.json_path}...")
    products = read_products(cfg.json_path)
    print(f"   ✓ Loaded {len(products)} products")
    
    print(f"\n🔤 Step 2: Rendering product texts...")
    texts = [render_product_text(p) for p in products]
    print(f"   ✓ Rendered {len(texts)} texts")

    print(f"\n🧠 Step 3: Embedding with {cfg.embedder_type} (model: {cfg.model_name or 'default'})...")
    embedder = build_embedder(cfg.embedder_type, cfg.model_name)
    print(f"   ⏳ Processing {len(texts)} texts (dimension: {embedder.dimension})...")
    embeddings = embedder.embed_texts(texts)
    print(f"   ✓ Generated {len(embeddings)} embeddings")

    print(f"\n🔌 Step 4: Connecting to Qdrant...")
    client = create_qdrant_client(cfg)
    print(f"   ✓ Connected to Qdrant")
    
    print(f"\n📦 Step 5: Ensuring collection '{cfg.collection_name}'...")
    ensure_qdrant_collection(
        client=client,
        collection_name=cfg.collection_name,
        vector_size=embedder.dimension,
        distance=cfg.distance,
    )

    print(f"\n🔧 Step 6: Building points...")
    points = build_points(products, embeddings)
    print(f"   ✓ Built {len(points)} points")
    
    print(f"\n💾 Step 7: Upserting to Qdrant collection '{cfg.collection_name}'...")
    upsert_points(client, cfg.collection_name, points, cfg.batch_size)
    
    print("\n" + "=" * 60)
    print("✅ PIPELINE COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    return (len(products), len(points))


def default_config() -> EmbedConfig:
    json_path = os.path.join(os.getcwd(), "total_products_processed_all.json")
    collection_name = os.getenv("QDRANT_COLLECTION", "bhx_products")
    embedder_type = os.getenv("EMBEDDER_TYPE", "gemini")
    model_name = os.getenv("EMBED_MODEL_NAME")
    batch_size = int(os.getenv("EMBED_BATCH", "128"))
    # Prefer URL if present; else host/port
    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_host = os.getenv("QDRANT_HOST")
    qdrant_port = int(os.getenv("QDRANT_PORT", "6333")) if os.getenv("QDRANT_PORT") else None
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    distance = os.getenv("QDRANT_DISTANCE", "Cosine")
    return EmbedConfig(
        json_path=json_path,
        collection_name=collection_name,
        embedder_type=embedder_type,
        model_name=model_name,
        batch_size=batch_size,
        qdrant_url=qdrant_url,
        qdrant_host=qdrant_host,
        qdrant_port=qdrant_port,
        qdrant_api_key=qdrant_api_key,
        distance=distance,
    )


if __name__ == "__main__":
    cfg = default_config()
    total, upserted = run_pipeline(cfg)
    print({"total": total, "upserted": upserted, "collection": cfg.collection_name})


