import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-200 transform hover:-translate-y-1 group">
      <Link href={`/products/${product.id}`}>
        <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.image_alt || product.product_name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <span className="text-5xl">🌾</span>
            </div>
          )}
          {product.discount_percent && product.discount_percent > 0 && (
            <Badge variant="danger" className="absolute top-3 right-3 shadow-lg">
              {product.discount_text || `-${product.discount_percent}%`}
            </Badge>
          )}
        </div>
      </Link>

      <div className="p-5">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-1.5 hover:text-green-600 transition-colors line-clamp-2 min-h-[3.5rem]">
            {product.product_name}
          </h3>
        </Link>

        {product.title && product.title !== product.product_name && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-1">{product.title}</p>
        )}

        {product.average_rating && product.review_count && (
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-700">
              {product.average_rating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500">({product.review_count})</span>
          </div>
        )}

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold text-green-600">
            {formatPrice(product.current_price)}
          </span>
          {product.original_price && product.original_price > product.current_price && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-sm text-gray-600 font-medium">
            <span className="text-gray-500">Đơn vị:</span> {product.unit}
          </span>
          {onAddToCart && (
            <Button
              size="sm"
              onClick={() => onAddToCart(product)}
              className="flex items-center gap-1.5"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Thêm</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

