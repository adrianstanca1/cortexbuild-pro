import { fileExists } from "@/lib/storage-adapter";

jest.mock("@/lib/s3", () => ({
  fileExists: jest.fn(),
}));

jest.mock("@/lib/local-storage", () => ({
  localFileExists: jest.fn(),
}));

const mockS3FileExists = jest.mocked(
  jest.requireMock("@/lib/s3").fileExists as jest.Mock
);
const mockLocalFileExists = jest.mocked(
  jest.requireMock("@/lib/local-storage").localFileExists as jest.Mock
);

describe("storage-adapter", () => {
  beforeEach(() => {
    mockS3FileExists.mockReset();
    mockLocalFileExists.mockReset();
    delete process.env.AWS_BUCKET_NAME;
    delete process.env.AWS_REGION;
  });

  it("uses S3 fileExists when S3 is configured", async () => {
    process.env.AWS_BUCKET_NAME = "bucket";
    process.env.AWS_REGION = "us-east-1";
    mockS3FileExists.mockResolvedValue(true);

    await expect(fileExists("path/to/file")).resolves.toBe(true);
    expect(mockS3FileExists).toHaveBeenCalledWith("path/to/file");
  });

  it("uses local fileExists when S3 is not configured", async () => {
    mockLocalFileExists.mockResolvedValue(false);

    await expect(fileExists("path/to/local")).resolves.toBe(false);
    expect(mockS3FileExists).not.toHaveBeenCalled();
    expect(mockLocalFileExists).toHaveBeenCalledWith("path/to/local");
  });
});
