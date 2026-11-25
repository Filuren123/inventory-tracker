import axios, { AxiosError, isAxiosError } from 'axios';

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

// Not logged in (or the session expired): send the user to the login page.
instance.interceptors.response.use(
    (res) => res,
    (error: AxiosError) => {
        const status = error.response?.status;
        const isLoginCall = error.config?.url?.includes('/user/login');
        if ((status === 401 || status === 403) && !isLoginCall && window.location.pathname !== '/login') {
            window.location.assign('/login');
        }
        return Promise.reject(error);
    },
);

/** Best-effort human-readable message from an API error. */
export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
    if (err instanceof AxiosError) {
        if (!err.response) return 'Server unreachable';
        const data = err.response.data as { message?: unknown } | string | undefined;
        if (typeof data === 'string' && data) return data;
        if (data && typeof data === 'object' && typeof data.message === 'string') return data.message;
    }
    if (err instanceof Error && err.message) return err.message;
    return fallback;
}

export default instance;

export const isNotFound = (err: unknown) => isAxiosError(err) && err.response?.status === 404;
export const statusOf = (err: unknown) => (isAxiosError(err) ? err.response?.status : undefined);
