// Helper function to extract error message from API responses
export function getErrorMessage(error: any): string {
  // If error is already a string
  if (typeof error === 'string') {
    return error;
  }

  // Handle axios error
  if (error.response) {
    const detail = error.response.data?.detail;

    // If detail is a string, return it
    if (typeof detail === 'string') {
      return detail;
    }

    // If detail is an array (FastAPI validation errors)
    if (Array.isArray(detail)) {
      return detail
        .map((err: any) => {
          const field = err.loc?.[err.loc.length - 1] || 'field';
          const message = err.msg || 'Invalid value';
          return `${field}: ${message}`;
        })
        .join(', ');
    }

    // If detail is an object with message
    if (detail && typeof detail === 'object' && detail.message) {
      return detail.message;
    }

    // Default message based on status code
    const status = error.response.status;
    if (status === 400) return 'Yêu cầu không hợp lệ';
    if (status === 401) return 'Chưa đăng nhập hoặc phiên đã hết hạn';
    if (status === 403) return 'Bạn không có quyền truy cập';
    if (status === 404) return 'Không tìm thấy dữ liệu';
    if (status === 422) return 'Dữ liệu nhập vào không hợp lệ';
    if (status === 500) return 'Lỗi máy chủ';
    
    return 'Đã có lỗi xảy ra';
  }

  // Handle network errors
  if (error.request) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  }

  // Default error
  return error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}

