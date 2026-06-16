export class ApiError extends Error {
  readonly statusCode?: number;
  readonly validationMessages?: string[];

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      validationMessages?: string[];
      cause?: unknown;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = 'ApiError';
    this.statusCode = options?.statusCode;
    this.validationMessages = options?.validationMessages;
  }
}

interface BackendErrorBody {
  message?: string | string[];
  statusCode?: number;
}

function extractValidationMessages(message: string | string[] | undefined): string[] | undefined {
  if (!message) {
    return undefined;
  }

  if (Array.isArray(message)) {
    return message;
  }

  return [message];
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'isAxiosError' in error) {
    const axiosError = error as {
      response?: { status?: number; data?: BackendErrorBody };
      message?: string;
    };

    const statusCode = axiosError.response?.status;
    const body = axiosError.response?.data;
    const validationMessages = extractValidationMessages(body?.message);

    if (statusCode === 401) {
      return new ApiError('Your session has expired. Please sign in again.', {
        statusCode,
        validationMessages,
        cause: error,
      });
    }

    if (statusCode === 403) {
      return new ApiError('You do not have permission to access this resource.', {
        statusCode,
        validationMessages,
        cause: error,
      });
    }

    if (statusCode === 404) {
      return new ApiError('The requested resource was not found.', {
        statusCode,
        validationMessages,
        cause: error,
      });
    }

    if (validationMessages && validationMessages.length > 0) {
      return new ApiError(validationMessages[0], {
        statusCode,
        validationMessages,
        cause: error,
      });
    }

    if (body?.message && typeof body.message === 'string') {
      return new ApiError(body.message, { statusCode, cause: error });
    }

    if (!axiosError.response) {
      return new ApiError('Unable to reach the server. Please try again later.', {
        cause: error,
      });
    }

    return new ApiError('Something went wrong. Please try again.', {
      statusCode,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new ApiError(error.message, { cause: error });
  }

  return new ApiError('Something went wrong. Please try again.', { cause: error });
}
