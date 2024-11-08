import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000";

export const signup = async (name, email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/signup`, {
      name,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { message: "An unknown error occurred." };
    }
  }
};

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { message: "An unknown error occurred." };
    }
  }
};

export const chat = async (token, message) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending message:", error);
    return { message: "An unknown error occurred." };
  }
};
