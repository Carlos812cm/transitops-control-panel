export function sendSuccess(response, message, data, statusCode = 200) {
    const body = {
        success: true,
        message,
    };
    if (data !== undefined) {
        body.data = data;
    }
    return response.status(statusCode).json(body);
}
export function sendError(response, statusCode, message, errors) {
    const body = {
        success: false,
        message,
    };
    if (errors !== undefined) {
        body.errors = errors;
    }
    return response.status(statusCode).json(body);
}
