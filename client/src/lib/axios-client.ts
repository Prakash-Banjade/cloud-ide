import axios from "axios";
import { API_URL } from "./utils";

export default axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 10000, // Optional: 10 seconds timeout
});