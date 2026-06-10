import multer from "multer";

const storage = multer.memoryStorage();

export const FormDataMiddleware = multer({ storage }).single("file");
