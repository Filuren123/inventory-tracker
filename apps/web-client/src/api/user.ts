import axios from "./axios";
import type { User } from "../model/user.interface"; // Adjust path to your frontend User model

export async function getUserByUsername(username: string): Promise<User> {
    try {
        const res = await axios.get(`/user/${username}`);
        return res.data;
    } catch (e: any) {
        if (e.response) {
            throw new Error(e.response.data.message || e.response.data);
        }
        throw new Error("Server unreachable");
    }
}

export async function login(username: string, password: string): Promise<{ accessToken: string }> {
    try {
        const res = await axios.post(`/user/login`, {
            username,
            password,
        });
        return res.data;
    } catch (e: any) {
        if (e.response) {
            throw new Error(e.response.data.message || e.response.data);
        }
        throw new Error("Server unreachable");
    }
}

export async function logout(): Promise<void> {
    try {
        await axios.post(`/user/logout`);
    } catch (e: any) {
        throw new Error(e.response?.data?.message ?? 'Server unreachable');
    }
}

export async function getCurrentUser(): Promise<{ user: { username: string } }> {
    try {
        const res = await axios.get(`/user/me`);
        return res.data;
    } catch (e: any) {
        if (e.response) {
            throw new Error(e.response.data.message || e.response.data);
        }
        throw new Error("Server unreachable");
    }
}