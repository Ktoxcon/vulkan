import type { NextFunction, Request, Response } from "express";

export type HttpHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => unknown | Promise<unknown>;
