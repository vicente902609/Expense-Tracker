import { Router } from "express";

import { AppError } from "../../lib/errors.js";
import { asyncHandler } from "../../lib/http.js";
import { addCustomCategory, deleteCustomCategory, listCustomCategories, renameCustomCategory } from "./service.js";

export const categoriesRouter = Router();

const getRouteParam = (value: string | string[] | undefined) => {
  if (typeof value !== "string" || !value) {
    throw new AppError("Invalid category name", 400);
  }

  return value;
};

categoriesRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const categories = await listCustomCategories(request.authUser!.id);
    response.json({ custom: categories });
  }),
);

categoriesRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const categories = await addCustomCategory(request.authUser!.id, request.body);
    response.status(201).json({ custom: categories });
  }),
);

categoriesRouter.patch(
  "/",
  asyncHandler(async (request, response) => {
    const categories = await renameCustomCategory(request.authUser!.id, request.body);
    response.json({ custom: categories });
  }),
);

categoriesRouter.delete(
  "/:name",
  asyncHandler(async (request, response) => {
    const categories = await deleteCustomCategory(request.authUser!.id, getRouteParam(request.params.name));
    response.json({ custom: categories });
  }),
);
