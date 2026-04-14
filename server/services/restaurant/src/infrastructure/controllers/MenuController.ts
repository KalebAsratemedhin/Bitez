import type { Request, Response, NextFunction } from "express";
import type { MenuUseCase } from "../../application/usecases/MenuUseCase.js";
import type { CloudinaryService } from "../services/CloudinaryService.js";
import type { AuthenticatedRequest } from "../web/middlewares/auth.js";
import { AppError } from "@bitez/shared";

function getUserId(req: AuthenticatedRequest): string {
  return typeof req.user?.id === "string" ? req.user.id : "";
}

function toMenuItemResponse(it: unknown): Record<string, unknown> {
  const item = it as { _id?: unknown; name?: string; description?: string; price?: number; itemPicture?: string };
  return {
    _id: item._id != null ? String(item._id) : "",
    name: item.name ?? "",
    description: item.description ?? "",
    price: item.price ?? 0,
    quantity: 0,
    rating: 0,
    itemPicture: item.itemPicture ?? "",
  };
}

function toMenuResponse(m: unknown): Record<string, unknown> {
  const x = m as { _id?: unknown; menuName?: string; restaurant?: unknown; menuItems?: unknown[] };
  return {
    _id: String(x._id ?? ""),
    menuName: x.menuName ?? "",
    restaurant: x.restaurant != null ? String(x.restaurant) : "",
    menuItems: ((x.menuItems ?? []) as unknown[]).map(toMenuItemResponse),
  };
}

export class MenuController {
  constructor(
    private readonly menuUseCase: MenuUseCase,
    private readonly cloudinary?: CloudinaryService,
  ) {}

  createMenu = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        next(new AppError({ code: "UNAUTHORIZED", status: 401, message: "Authentication required", expose: true }));
        return;
      }
      const restaurantId =
        typeof req.params.restaurantId === "string"
          ? req.params.restaurantId
          : (req.params.restaurantId as string[])?.[0] ?? "";
      const body = req.body as { menuName?: string; menuItems?: string };
      const menuName = body.menuName?.trim();
      if (!menuName) {
        next(new AppError({ code: "BAD_REQUEST", status: 400, message: "Menu name is required", expose: true }));
        return;
      }
      let items: { name: string; description: string; price: number }[];
      try {
        items = JSON.parse(body.menuItems || "[]");
      } catch {
        next(new AppError({ code: "BAD_REQUEST", status: 400, message: "Invalid menuItems JSON", expose: true }));
        return;
      }
      if (!Array.isArray(items) || items.length === 0) {
        next(new AppError({ code: "BAD_REQUEST", status: 400, message: "At least one menu item is required", expose: true }));
        return;
      }
      const files = (req as Request & { files?: { buffer?: Buffer; mimetype?: string }[] }).files ?? [];
      const itemPicturePaths: string[] = [];
      if (files.length > 0 && this.cloudinary) {
        for (const f of files) {
          if (f.buffer) {
            try {
              const url = await this.cloudinary.uploadBuffer(
                f.buffer,
                "menus",
                { mimetype: f.mimetype },
              );
              itemPicturePaths.push(url);
            } catch {
              itemPicturePaths.push("");
            }
          } else itemPicturePaths.push("");
        }
      }
      const menu = await this.menuUseCase.create({
        restaurantId,
        userId,
        menuName,
        menuItems: items.map((item) => ({
          name: item.name ?? "",
          description: item.description ?? "",
          price: Number(item.price) || 0,
        })),
        itemPicturePaths,
      });
      const created = menu as { _id?: unknown; menuName?: string; menuItems?: unknown[] };
      res.status(201).json({
        message: "Menu created successfully",
        data: {
          _id: String(created._id ?? ""),
          menuName: created.menuName ?? "",
          restaurant: restaurantId,
          menuItems: (created.menuItems ?? []).map(toMenuItemResponse),
        },
      });
    } catch (e) {
      const err = e as Error;
      if (err.message?.includes("Not the owner")) {
        next(new AppError({ code: "FORBIDDEN", status: 403, message: err.message, expose: true, cause: e }));
        return;
      }
      next(e);
    }
  };

  getMenuByRestaurant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantId =
        typeof req.params.restaurantId === "string"
          ? req.params.restaurantId
          : (req.params.restaurantId as string[])?.[0] ?? "";
      const menus = await this.menuUseCase.getByRestaurantId({ restaurantId });
      const out = (menus as unknown[]).map(toMenuResponse);
      res.json({ menus: out });
    } catch (e) {
      next(e);
    }
  };

  getMenuById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuId = String(req.params.id ?? "").split(",")[0];
      const menu = await this.menuUseCase.getById({ menuId });
      if (!menu) {
        next(new AppError({ code: "NOT_FOUND", status: 404, message: "Menu not found", expose: true }));
        return;
      }
      res.json(toMenuResponse(menu));
    } catch (e) {
      next(e);
    }
  };

  updateMenu = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuId =
        typeof req.params.menuId === "string"
          ? req.params.menuId
          : (req.params.menuId as string[])?.[0] ?? "";
      const body = req.body as {
        menuName?: string;
        menuItems?: string;
        newPictureIndices?: string;
      };
      const files = (req as Request & { files?: { buffer?: Buffer; mimetype?: string }[] }).files ?? [];
      const itemPicturePaths: string[] = [];
      if (files.length > 0 && this.cloudinary) {
        for (const f of files) {
          if (f.buffer) {
            try {
              const url = await this.cloudinary.uploadBuffer(
                f.buffer,
                "menus",
                { mimetype: f.mimetype },
              );
              itemPicturePaths.push(url);
            } catch {
              itemPicturePaths.push("");
            }
          } else itemPicturePaths.push("");
        }
      }
      let newPictureIndices: number[] = [];
      try {
        if (body.newPictureIndices) {
          newPictureIndices = JSON.parse(body.newPictureIndices) as number[];
        }
      } catch {
      }
      const update: {
        menuName?: string;
        menuItems?: { name: string; description: string; price: number; itemPicture?: string }[];
      } = {};
      if (body.menuName !== undefined) update.menuName = body.menuName.trim();
      if (body.menuItems !== undefined) {
        try {
          const items = JSON.parse(body.menuItems) as {
            name: string;
            description: string;
            price: number;
            itemPicture?: string;
          }[];
          update.menuItems = items.map((item, i) => {
            const existingPicture = item.itemPicture ?? "";
            const newFileIndex = newPictureIndices.indexOf(i);
            const picture =
              newFileIndex >= 0 && itemPicturePaths[newFileIndex]
                ? itemPicturePaths[newFileIndex]
                : existingPicture;
            return {
              name: item.name ?? "",
              description: item.description ?? "",
              price: Number(item.price) || 0,
              itemPicture: picture,
            };
          });
        } catch {
          next(new AppError({ code: "BAD_REQUEST", status: 400, message: "Invalid menuItems JSON", expose: true }));
          return;
        }
      }
      await this.menuUseCase.update({
        menuId,
        userId: getUserId(req),
        menuName: update.menuName,
        menuItems: update.menuItems,
        itemPicturePaths: itemPicturePaths.length ? itemPicturePaths : undefined,
      });
      res.json({ message: "Menu updated successfully" });
    } catch (e) {
      const err = e as Error;
      if (err.message?.includes("Not the owner")) {
        next(new AppError({ code: "FORBIDDEN", status: 403, message: err.message, expose: true, cause: e }));
        return;
      }
      if (err.message?.includes("not found")) {
        next(new AppError({ code: "NOT_FOUND", status: 404, message: err.message, expose: true, cause: e }));
        return;
      }
      next(e);
    }
  };

  deleteMenu = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuId =
        typeof req.params.menuId === "string"
          ? req.params.menuId
          : (req.params.menuId as string[])?.[0] ?? "";
      await this.menuUseCase.delete({ menuId, userId: getUserId(req) });
      res.json({ message: "Menu deleted successfully" });
    } catch (e) {
      const err = e as Error;
      if (err.message?.includes("Not the owner")) {
        next(new AppError({ code: "FORBIDDEN", status: 403, message: err.message, expose: true, cause: e }));
        return;
      }
      if (err.message?.includes("not found")) {
        next(new AppError({ code: "NOT_FOUND", status: 404, message: err.message, expose: true, cause: e }));
        return;
      }
      next(e);
    }
  };
}
