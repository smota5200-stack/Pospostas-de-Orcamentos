import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadRouter } from "./upload";
import * as storage from "../storage";

// Mock do módulo storage
vi.mock("../storage", () => ({
  storagePut: vi.fn(),
}));

// Mock do nanoid
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "test-id-123"),
}));

describe("Upload Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: 1,
    openId: "test-user",
    name: "Test User",
    email: "test@example.com",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  describe("customOrderImage", () => {
    it("should upload a valid image", async () => {
      const mockBase64 = Buffer.from("fake image data").toString("base64");
      const mockUrl = "https://storage.example.com/custom-orders/1/test-id-123.jpg";

      vi.mocked(storage.storagePut).mockResolvedValue({
        key: "custom-orders/1/test-id-123.jpg",
        url: mockUrl,
      });

      const caller = uploadRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.customOrderImage({
        file: mockBase64,
        fileName: "test.jpg",
        mimeType: "image/jpeg",
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe(mockUrl);
      expect(storage.storagePut).toHaveBeenCalled();
    });

    it("should reject invalid file types", async () => {
      const mockBase64 = Buffer.from("fake file data").toString("base64");

      const caller = uploadRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.customOrderImage({
          file: mockBase64,
          fileName: "test.pdf",
          mimeType: "application/pdf",
        })
      ).rejects.toThrow("Tipo de arquivo não permitido");
    });

    it("should reject files larger than 5MB", async () => {
      // Criar um buffer de 6MB
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
      const mockBase64 = largeBuffer.toString("base64");

      const caller = uploadRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.customOrderImage({
          file: mockBase64,
          fileName: "large.jpg",
          mimeType: "image/jpeg",
        })
      ).rejects.toThrow("Arquivo muito grande");
    });

    it("should accept all valid image types", async () => {
      const mockBase64 = Buffer.from("fake image data").toString("base64");
      const mockUrl = "https://storage.example.com/custom-orders/1/test-id-123.jpg";

      vi.mocked(storage.storagePut).mockResolvedValue({
        key: "custom-orders/1/test-id-123.jpg",
        url: mockUrl,
      });

      const caller = uploadRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const validTypes = [
        { type: "image/jpeg", ext: "jpg" },
        { type: "image/png", ext: "png" },
        { type: "image/webp", ext: "webp" },
        { type: "image/gif", ext: "gif" },
      ];

      for (const { type, ext } of validTypes) {
        const result = await caller.customOrderImage({
          file: mockBase64,
          fileName: `test.${ext}`,
          mimeType: type,
        });

        expect(result.success).toBe(true);
        expect(result.url).toBe(mockUrl);
      }
    });
  });

  describe("multipleImages", () => {
    it("should upload multiple images", async () => {
      const mockBase64 = Buffer.from("fake image data").toString("base64");
      const mockUrl1 = "https://storage.example.com/custom-orders/1/test-id-1.jpg";
      const mockUrl2 = "https://storage.example.com/custom-orders/1/test-id-2.jpg";

      vi.mocked(storage.storagePut)
        .mockResolvedValueOnce({
          key: "custom-orders/1/test-id-1.jpg",
          url: mockUrl1,
        })
        .mockResolvedValueOnce({
          key: "custom-orders/1/test-id-2.jpg",
          url: mockUrl2,
        });

      const caller = uploadRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.multipleImages({
        files: [
          {
            file: mockBase64,
            fileName: "test1.jpg",
            mimeType: "image/jpeg",
          },
          {
            file: mockBase64,
            fileName: "test2.jpg",
            mimeType: "image/jpeg",
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.files[0]?.url).toBe(mockUrl1);
      expect(result.files[1]?.url).toBe(mockUrl2);
    });

    it("should reject if any file has invalid type", async () => {
      const mockBase64 = Buffer.from("fake data").toString("base64");

      const caller = uploadRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.multipleImages({
          files: [
            {
              file: mockBase64,
              fileName: "test.jpg",
              mimeType: "image/jpeg",
            },
            {
              file: mockBase64,
              fileName: "test.pdf",
              mimeType: "application/pdf",
            },
          ],
        })
      ).rejects.toThrow("Tipo de arquivo não permitido");
    });
  });
});
