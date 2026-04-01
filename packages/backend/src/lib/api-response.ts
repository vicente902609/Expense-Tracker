import type { Response } from "express";

export const sendOk = <T>(response: Response, data: T, statusCode = 200): void => {
  response.status(statusCode).json({ success: true, data });
};

export const sendCreated = <T>(response: Response, data: T): void => {
  sendOk(response, data, 201);
};

export const sendBadRequest = (response: Response, errors: unknown): void => {
  response.status(400).json({ success: false, errors });
};

export const sendUnauthorized = (response: Response, message = "Unauthorized"): void => {
  response.status(401).json({ success: false, message });
};

export const sendConflict = (response: Response, message: string): void => {
  response.status(409).json({ success: false, message });
};

export const sendInternalError = (response: Response, message = "Internal server error"): void => {
  response.status(500).json({ success: false, message });
};
