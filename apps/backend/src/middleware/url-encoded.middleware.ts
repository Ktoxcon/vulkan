import express from "express";

export const UrlEncodedMiddleware = express.urlencoded({ extended: true });
