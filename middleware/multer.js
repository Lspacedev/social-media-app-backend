const multer = require("multer");

// Configure multer storage and file name
const storage = multer.memoryStorage();

// // Create multer upload instance
const upload = multer({ storage: storage });

// Custom file upload middleware
const uploadMiddleware = (req, res, next) => {
  console.log("dskf", req.files);
  upload.array("image", 2)(req, res, (err) => {
    if (err) {
      console.log({ err });
      return res.status(400).json({ error: err.message });
    }

    if (typeof req.files !== "undefined") {
      // Retrieve uploaded files
      const files = req.files;
      console.log({ files });
      const errors = [];

      // Validate file types and sizes
      files.forEach((file) => {
        const allowedTypes = ["image/jpeg", "image/png"];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.mimetype)) {
          errors.push(`Invalid file type: ${file.originalname}`);
        }

        if (file.size > maxSize) {
          errors.push(`File too large: ${file.originalname}`);
        }
      });

      // Handle validation errors
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      // Attach files to the request object
      req.files = files;
    }
    next();
  });
};

module.exports = uploadMiddleware;
