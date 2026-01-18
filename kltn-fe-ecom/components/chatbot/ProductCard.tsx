'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { ChatbotProduct } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ChatProductCardProps {
  product: ChatbotProduct;
  onAddToCart?: (product: ChatbotProduct) => void;
}

export function ChatProductCard({ product, onAddToCart }: ChatProductCardProps) {
  // Use product_id to create link to detail page
  let productId: number | null = null;
  if (product.product_id) {
    const parsed = parseInt(product.product_id);
    productId = !isNaN(parsed) && parsed > 0 ? parsed : null;
  }
  const productUrl = productId ? `/products/${productId}` : null;
  
  // Use price_text if available, otherwise format from price
  const displayPrice = product.price_text || formatPrice(product.price);
  
  // Calculate original price if discount exists
  const originalPrice = product.discount_percent && product.discount_percent > 0
    ? product.price / (1 - product.discount_percent / 100)
    : null;

  const imageContent = product.image_url ? (
    <Image
      src={product.image_url}
      alt={product.product_name}
      fill
      className="object-cover"
    />
  ) : (
    <div className="flex items-center justify-center h-full text-gray-400">
      <span className="text-2xl">🌾</span>
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden my-2">
      <div className="flex gap-3 p-3">
        {productUrl ? (
          <Link href={productUrl} className="flex-shrink-0">
            <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
              {imageContent}
            </div>
          </Link>
        ) : (
          <div className="flex-shrink-0">
            <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
              {imageContent}
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {productUrl ? (
            <Link href={productUrl}>
              <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 hover:text-green-600">
                {product.product_name}
              </h4>
            </Link>
          ) : (
            <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2">
              {product.product_name}
            </h4>
          )}
          
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-extrabold text-green-600">
              {displayPrice}
            </span>
            {originalPrice && (
              <span className="text-xs text-gray-500 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
            {product.discount_percent && product.discount_percent > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">
                -{product.discount_percent}%
              </span>
            )}
          </div>

          {product.unit && (
            <p className="text-xs text-gray-600 mb-2">Đơn vị: {product.unit}</p>
          )}

          {product.score && (
            <p className="text-xs text-blue-600 mb-2">
              Độ phù hợp: {(product.score * 100).toFixed(0)}%
            </p>
          )}

          {onAddToCart && product.product_id && (
            <Button
              size="sm"
              onClick={() => onAddToCart(product)}
              className="w-full text-xs py-1.5"
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              Thêm vào giỏ
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

