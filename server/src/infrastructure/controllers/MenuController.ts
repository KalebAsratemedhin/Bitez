import type { Request, Response } from "express";
import type { MenuUseCase } from "@application/usecases/MenuUseCase.js";

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

function getUserId(req: AuthenticatedRequest): string {
  return req.user!.id;
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
  constructor(private readonly menuUseCase: MenuUseCase) {}

  createMenu = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const restaurantId =
        typeof req.params.restaurantId === "string"
          ? req.params.restaurantId
          : (req.params.restaurantId as string[])?.[0] ?? "";
      const body = req.body as { menuName?: string; menuItems?: string };
      const menuName = body.menuName?.trim();
      if (!menuName) {
        res.status(400).json({ message: "Menu name is required" });
        return;
      }
      let items: { name: string; description: string; price: number }[];
      try {
        items = JSON.parse(body.menuItems || "[]");
      } catch {
        res.status(400).json({ message: "Invalid menuItems JSON" });
        return;
      }
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ message: "At least one menu item is required" });
        return;
      }
      const files = (req as Request & { files?: { filename: string }[] }).files ?? [];
      const itemPicturePaths = files.map((f) => `/uploads/menus/${f.filename}`);
      const menu = await this.menuUseCase.create({
        restaurantId,
        userId: getUserId(req),
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
      if (err.message?.includes("Not the owner")) res.status(403).json({ message: err.message });
      else res.status(500).json({ message: err.message });
    }
  };

  getMenuByRestaurant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const restaurantId =
        typeof req.params.restaurantId === "string"
          ? req.params.restaurantId
          : (req.params.restaurantId as string[])?.[0] ?? "";
      const menus = await this.menuUseCase.getByRestaurantId({ restaurantId });
      const out = (menus as unknown[]).map(toMenuResponse);
      res.json({ menus: out });
    } catch (e) {
      res.status(500).json({ message: (e as Error).message });
    }
  };

  getMenuById = async (req: Request, res: Response): Promise<void> => {
    try {
      const menuId = String(req.params.id ?? "").split(",")[0];
      const menu = await this.menuUseCase.getById({ menuId });
      if (!menu) {
        res.status(404).json({ message: "Menu not found" });
        return;
      }
      res.json(toMenuResponse(menu));
    } catch (e) {
      res.status(500).json({ message: (e as Error).message });
    }
  };

  updateMenu = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      const files = (req as Request & { files?: { filename: string }[] }).files ?? [];
      const itemPicturePaths = files.map((f) => `/uploads/menus/${f.filename}`);
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
          res.status(400).json({ message: "Invalid menuItems JSON" });
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
      if (err.message?.includes("Not the owner")) res.status(403).json({ message: err.message });
      else if (err.message?.includes("not found")) res.status(404).json({ message: err.message });
      else res.status(500).json({ message: err.message });
    }
  };

  deleteMenu = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const menuId =
        typeof req.params.menuId === "string"
          ? req.params.menuId
          : (req.params.menuId as string[])?.[0] ?? "";
      await this.menuUseCase.delete({ menuId, userId: getUserId(req) });
      res.json({ message: "Menu deleted successfully" });
    } catch (e) {
      const err = e as Error;
      if (err.message?.includes("Not the owner")) res.status(403).json({ message: err.message });
      else if (err.message?.includes("not found")) res.status(404).json({ message: err.message });
      else res.status(500).json({ message: err.message });
    }
  };
}
