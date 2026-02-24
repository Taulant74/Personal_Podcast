export const API_BASE =
    process.env.NODE_ENV === "development"
        ? (process.env.REACT_APP_API_BASE || "https://localhost:7261")
        : ""; 

console.log("API_BASE =", process.env.REACT_APP_API_BASE, process.env.NODE_ENV);

export const apiUrl = (path) => `${API_BASE}${path}`;