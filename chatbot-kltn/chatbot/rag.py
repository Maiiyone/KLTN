from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, Range

from core.config import Settings


class QdrantRAG:
    def __init__(self, settings: Settings) -> None:
        self.url = settings.qdrant_url
        self.api_key = settings.qdrant_api_key
        self.collection = settings.qdrant_collection
        self.client: QdrantClient | None = None
        if self.url:
            try:
                self.client = QdrantClient(
                    url=self.url,
                    api_key=self.api_key if self.api_key else None,
                )
                print(f"[RAG] Connected to Qdrant at {self.url}, collection: {self.collection}")
            except Exception as e:
                print(f"[RAG] Failed to connect to Qdrant: {e}")
                self.client = None

    @property
    def available(self) -> bool:
        return self.client is not None

    def search_products(
        self,
        query_text: str,
        *,
        limit: int = 5,
        min_price: float | None = None,
        max_price: float | None = None,
    ) -> list[dict[str, Any]]:
        if not self.available:
            return []

        try:
            filters = []
            if min_price is not None or max_price is not None:
                price_filter = {}
                if min_price is not None:
                    price_filter["gte"] = min_price
                if max_price is not None:
                    price_filter["lte"] = max_price
                filters.append(
                    FieldCondition(
                        key="current_price",
                        range=Range(**price_filter),
                    )
                )

            search_filter = Filter(must=filters) if filters else None

            if not query_text or not query_text.strip():
                print("[RAG] Empty query text, skipping Qdrant search")
                return []

            query_text_clean = query_text.strip()
            
            try:
                from qdrant_client.models import QueryRequest, Query
                query_req = QueryRequest(
                    query=Query(text=query_text_clean),
                    limit=limit,
                    filter=search_filter,
                )
                results = self.client.query(
                    collection_name=self.collection,
                    query_request=query_req,
                )
            except Exception as e:
                print(f"[RAG] Error with QueryRequest: {e}")
                try:
                    results = self.client.query(
                        collection_name=self.collection,
                        query_text=query_text_clean,
                        limit=limit,
                        query_filter=search_filter,
                    )
                except Exception as e2:
                    print(f"[RAG] Error with query_text: {e2}, falling back to SQL")
                    return []

            products = []
            for point in results.points:
                payload = point.payload
                if payload:
                    products.append(
                        {
                            "product_id": payload.get("product_id"),
                            "product_code": payload.get("product_code"),
                            "product_name": payload.get("product_name") or payload.get("title"),
                            "price": payload.get("current_price", 0),
                            "price_text": payload.get("current_price_text"),
                            "unit": payload.get("unit"),
                            "product_url": payload.get("product_url"),
                            "image_url": payload.get("image_url"),
                            "score": point.score,
                        }
                    )

            print(f"[RAG] Found {len(products)} products for query: {query_text}")
            return products
        except Exception as e:
            print(f"[RAG] Error searching Qdrant: {e}")
            return []

