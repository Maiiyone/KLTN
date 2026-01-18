'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, ShoppingCart, ArrowLeft, Package, Shield, TruckIcon, MessageCircle } from 'lucide-react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { productsAPI } from '@/lib/api/products';
import { reviewsAPI } from '@/lib/api/reviews';
import { useCartStore } from '@/lib/store/cart-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { useToast } from '@/components/ui/Toast';
import { Product, Review } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { getErrorMessage } from '@/lib/error-handler';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated } = useAuthStore();
  const toast = useToast();

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getProduct(Number(params.id));
      setProduct(data);
    } catch (err) {
      setError('Không thể tải thông tin sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await reviewsAPI.getProductReviews(Number(params.id), { limit: 10 });
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      toast.success(
        'Đã thêm vào giỏ hàng!',
        `${quantity} ${product.unit} ${product.product_name}`,
        3000
      );
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để đánh giá sản phẩm');
      router.push('/auth/login');
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewsAPI.createReview({
        product_id: Number(params.id),
        rating: reviewRating,
        comment: reviewComment,
      });
      alert('Đánh giá của bạn đã được gửi!');
      setReviewComment('');
      setReviewRating(5);
      fetchReviews();
      fetchProduct();
    } catch (err: any) {
      alert(getErrorMessage(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <MainLayout><Loading /></MainLayout>;
  if (error || !product) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <Alert variant="error">{error || 'Không tìm thấy sản phẩm'}</Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:bg-green-50">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="space-y-3">
            <div className="relative h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden group shadow-lg">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.image_alt || product.product_name}
                  fill
                  className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <span className="text-8xl animate-pulse">🌾</span>
                </div>
              )}
              {product.discount_percent && product.discount_percent > 0 && (
                <div className="absolute top-4 right-4">
                  <Badge variant="danger" className="text-sm px-3 py-1.5 shadow-lg">
                    GIẢM {product.discount_percent}%
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-all">
                <Shield className="w-6 h-6 mx-auto mb-1 text-green-600" />
                <p className="text-xs font-semibold text-gray-700">100% Sạch</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-all">
                <TruckIcon className="w-6 h-6 mx-auto mb-1 text-green-600" />
                <p className="text-xs font-semibold text-gray-700">Giao Nhanh</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-all">
                <Package className="w-6 h-6 mx-auto mb-1 text-green-600" />
                <p className="text-xs font-semibold text-gray-700">Đảm Bảo</p>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            {/* Product name and rating */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                {product.product_name}
              </h1>
              {product.title && product.title !== product.product_name && (
                <p className="text-base text-gray-600 mb-3">{product.title}</p>
              )}

              {product.average_rating && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.average_rating!)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-base">{product.average_rating.toFixed(1)}</span>
                  <span className="text-gray-500 text-sm">({product.review_count} đánh giá)</span>
                </div>
              )}
            </div>

            {/* Price section */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-3xl font-bold text-green-600">
                  {formatPrice(product.current_price)}
                </span>
                {product.original_price && product.original_price > product.current_price && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 font-medium">
                Giá đã bao gồm VAT
              </p>
            </div>

            {/* Product details */}
            <div className="space-y-2 bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-600 text-sm font-medium">Đơn vị:</span>
                <span className="text-gray-900 font-bold text-sm">{product.unit}</span>
              </div>
              {product.stock_quantity !== undefined && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-600 text-sm font-medium">Tồn kho:</span>
                  {product.stock_quantity > 0 ? (
                    <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg text-sm">
                      {product.stock_quantity} {product.unit}
                    </span>
                  ) : (
                    <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded-lg text-sm">
                      Hết hàng
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Add to cart section */}
            <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-gray-200">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Số lượng:
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 font-bold text-base transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center font-bold text-base border-x-2 border-gray-200 py-2"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 font-bold text-base transition-colors"
                  >
                    +
                  </button>
                </div>
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={product.stock_quantity === 0}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Thêm vào giỏ hàng</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section - Description & Reviews */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Tabs Header */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('description')}
                className={`flex-1 px-8 py-5 font-bold text-lg transition-all ${
                  activeTab === 'description'
                    ? 'text-green-600 border-b-4 border-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                📋 Mô Tả Sản Phẩm
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 px-8 py-5 font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'reviews'
                    ? 'text-green-600 border-b-4 border-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                Đánh Giá ({reviews.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'description' ? (
              <div className="prose max-w-none">
                {product.description ? (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Chi tiết sản phẩm</h3>
                    <p className="text-gray-700 text-lg leading-relaxed">{product.description}</p>
                    
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                        <h4 className="font-bold text-lg text-green-800 mb-3">🌱 Cam kết chất lượng</h4>
                        <ul className="space-y-2 text-gray-700">
                          <li>✓ 100% nông sản sạch</li>
                          <li>✓ Không sử dụng hóa chất</li>
                          <li>✓ Kiểm tra chất lượng nghiêm ngặt</li>
                        </ul>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                        <h4 className="font-bold text-lg text-blue-800 mb-3">🚚 Vận chuyển</h4>
                        <ul className="space-y-2 text-gray-700">
                          <li>✓ Giao hàng nhanh trong 24h</li>
                          <li>✓ Đóng gói cẩn thận</li>
                          <li>✓ Hoàn tiền nếu không hài lòng</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Chưa có mô tả chi tiết cho sản phẩm này.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Write Review */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200">
                  <h3 className="text-2xl font-bold mb-6 text-green-800">✍️ Viết đánh giá của bạn</h3>
                  <form onSubmit={handleSubmitReview} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold mb-3 text-gray-700">Xếp hạng của bạn:</label>
                      <div className="flex gap-2 bg-white rounded-xl p-4 justify-center">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setReviewRating(rating)}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-10 h-10 ${
                                rating <= reviewRating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <Textarea
                      label="Nhận xét của bạn"
                      placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={5}
                      className="bg-white"
                    />

                    <Button type="submit" isLoading={submittingReview} className="w-full" size="lg">
                      Gửi đánh giá
                    </Button>
                  </form>
                </div>

                {/* Reviews List */}
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-gray-800">
                    💬 Đánh giá từ khách hàng
                  </h3>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {reviews.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-2xl">
                        <div className="text-6xl mb-4">🤔</div>
                        <p className="text-gray-500 font-medium">Chưa có đánh giá nào.</p>
                        <p className="text-gray-400 text-sm mt-2">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-all">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                              {review.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900">{review.username}</span>
                              {review.is_verified_purchase && (
                                <Badge variant="success" className="ml-2">
                                  ✓ Đã mua
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500 font-medium">
                              • {formatDate(review.created_at)}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

