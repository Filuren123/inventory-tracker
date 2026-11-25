import axios from './axios';

export async function login(username: string, password: string): Promise<void> {
    await axios.post('/user/login', { username, password });
}

export async function logout(): Promise<void> {
    await axios.post('/user/logout');
}
