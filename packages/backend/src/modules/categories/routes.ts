import { Router } from "express";

import { AppError } from "../../lib/errors.js";
import { asyncHandler } from "../../lib/http.js";
import { addCustomCategory, deleteCustomCategory, listCategories, updateCustomCategory } from "./service.js";

export const categoriesRouter = Router();

const getCategoryIdParam = (value: string | string[] | undefined) => {
  if (typeof value !== "string" || !value) {
    throw new AppError("Invalid category id", 400);
  }

  return decodeURIComponent(value);
};

categoriesRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const categories = await listCategories(request.authUser!.id);
    response.json(categories);
  }),
);

categoriesRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const categories = await addCustomCategory(request.authUser!.id, request.body);
    response.status(201).json(categories);
  }),
);

categoriesRouter.patch(
  "/:categoryId",
  asyncHandler(async (request, response) => {
    const categories = await updateCustomCategory(request.authUser!.id, getCategoryIdParam(request.params.categoryId), request.body);
    response.json(categories);
  }),
);

categoriesRouter.delete(
  "/:categoryId",
  asyncHandler(async (request, response) => {
    const categories = await deleteCustomCategory(request.authUser!.id, getCategoryIdParam(request.params.categoryId));
    response.json(categories);
  }),
);
