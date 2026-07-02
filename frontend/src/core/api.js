export async function apiClient(url, options = {}) {
  // Get token with fallbacks
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken');

  const headers = {
    ...(options.headers || {})
  };

  // Only set Content-Type to JSON if body is not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const activeAssignmentId = localStorage.getItem('activeAssignmentId');
  if (activeAssignmentId) {
    headers['X-Context-Assignment-Id'] = activeAssignmentId;
  }

  const fetchOptions = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      const hadToken =
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken');

      if (hadToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        alert('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
        window.location.href = '/login';
      }
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }

    if (response.status === 403) {
      alert('해당 작업을 수행할 권한이 없습니다.');
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }



    // Handle binary responses if requested
    if (options.responseType === 'blob') {
      if (!response.ok) {
        let errText = await response.text();
        try {
          const errJson = JSON.parse(errText);
          const errMsg = errJson.details || errJson.message || errJson.error || '요청 처리 중 오류가 발생했습니다.';
          const err = new Error(errMsg);
          err.status = response.status;
          err.data = errJson;
          throw err;
        } catch (e) {
          const err = new Error(errText || '요청 처리 중 오류가 발생했습니다.');
          err.status = response.status;
          throw err;
        }
      }
      return await response.blob();
    }

    // Try parsing as JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      const errMsg = data.details || data.message || data.error || '요청 처리 중 오류가 발생했습니다.';
      const err = new Error(errMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    // If it's already an error with status, rethrow it
    if (err.status) {
      throw err;
    }
    // Network or other fetch errors
    console.error('[API Client Error]', err);
    throw new Error('네트워크 연결이 불안정합니다. 잠시 후 다시 시도해 주세요.');
  }
}
