import axios from "axios";
import type { User } from "../model/user.interface"; // Adjust path to your frontend User model

const baseURL: string = import.meta.env.VITE_API_URL;

// Note: Assuming your Express app maps the userRouter to '/user' or '/api/user'. 
// Adjust the `${baseURL}/user` path below if your backend routing uses a different base path.

export async function getUserByUsername(username: string): Promise<User> {
    try {
        const res = await axios.get(`${baseURL}/user/${username}`);
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
        const res = await axios.post(`${baseURL}/user/login`, {
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