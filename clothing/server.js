const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;


// ==================================================
// START
// ==================================================

console.log("🔥 RUNNING FILE:", __filename);

console.log("");
console.log("========================================");
console.log("🔥 YEMEN LEBS SERVER STARTING...");
console.log("========================================");

// ==================================================
// MIDDLEWARE
// ==================================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

// ==================================================
// ENV CHECK
// ==================================================

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI IS MISSING FROM .env");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET IS MISSING FROM .env");
  process.exit(1);
}

if (!process.env.ADMIN_EMAIL) {
  console.error("❌ ADMIN_EMAIL IS MISSING FROM .env");
  process.exit(1);
}

if (!process.env.ADMIN_PASSWORD) {
  console.error("❌ ADMIN_PASSWORD IS MISSING FROM .env");
  process.exit(1);
}

// ==================================================
// ADOBE
// ==================================================

const adobePath = path.join(
  __dirname,
  "adobe"
);

console.log(
  "📁 ADOBE PATH:",
  adobePath
);

if (!fs.existsSync(adobePath)) {
  console.error("❌ ADOBE FOLDER NOT FOUND!");
}

app.use(
  "/adobe",
  express.static(adobePath)
);
// ==================================================
// FRONTEND STATIC FILES
// ==================================================

app.use(express.static(__dirname));

app.get("/", function (req, res) {
  return res.sendFile(
    path.join(__dirname, "index.html")
  );
});
// ==================================================
// UPLOAD FOLDER
// ==================================================
app.use('/adobe/uploads', express.static(path.join(__dirname, 'adobe/uploads')));

const uploadPath = path.join(
  adobePath,
  "uploads"
);

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, {
    recursive: true
  });
}

console.log(
  "📁 UPLOAD PATH:",
  uploadPath
);

// ==================================================
// MULTER
// ==================================================

const storage = multer.diskStorage({

  destination: function (req, file, cb) {

    cb(
      null,
      uploadPath
    );

  },

  filename: function (req, file, cb) {

    const ext =
      path.extname(
        file.originalname
      ).toLowerCase();

    const filename =
      Date.now() +
      "-" +
      Math.round(
        Math.random() * 1000000000
      ) +
      ext;

    cb(
      null,
      filename
    );

  }

});

const upload = multer({

  storage: storage,

  limits: {
    fileSize:
      10 * 1024 * 1024
  },

  fileFilter:
    function (req, file, cb) {

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
      ];

      if (
        !allowedTypes.includes(
          file.mimetype
        )
      ) {

        return cb(
          new Error(
            "Only JPG, PNG, WEBP and GIF images are allowed"
          )
        );

      }

      cb(
        null,
        true
      );

    }

});

// ==================================================
// AUTH MIDDLEWARE
// ==================================================

function isValidEmail(value) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

}

function readTrimmedString(value) {

  if (value === null || value === undefined) {

    return "";

  }

  return String(value).trim();

}

function isPositiveNumber(value, min = 0) {

  const number = Number(value);

  return Number.isFinite(number) && number >= min;

}

function verifyToken(req, res, next) {

  try {

    const authHeader =
      typeof req.headers.authorization === "string"
        ? req.headers.authorization
        : "";

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {

      return res
        .status(401)
        .json({

          success: false,

          message:
            "Authorization token is required"

        });

    }

    const token =
      authHeader.substring(7).trim();

    if (!token) {

      return res
        .status(401)
        .json({

          success: false,

          message:
            "Authorization token is required"

        });

    }

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    req.user =
      decoded;

    next();

  } catch (error) {

    console.error(
      "❌ TOKEN ERROR:",
      error.message
    );

    return res
      .status(401)
      .json({

        success: false,

        message:
          "Invalid or expired token"

      });

  }

}

// ==================================================
// ADMIN MIDDLEWARE
// ==================================================

function verifyAdmin(req, res, next) {

  if (
    !req.user ||
    req.user.role !== "admin"
  ) {

    return res
      .status(403)
      .json({

        success: false,

        message:
          "Admin access required"

      });

  }

  next();

}

// ==================================================
// ABOUT IMAGE
// ==================================================

const aboutImagePath =
  path.join(
    __dirname,
    "images",
    "my-phot.jpg"
  );

app.get(
  "/about-image",
  function (req, res) {

    if (
      !fs.existsSync(
        aboutImagePath
      )
    ) {

      return res
        .status(404)
        .send(
          "About image not found"
        );

    }

    return res.sendFile(
      aboutImagePath
    );

  }
);

// ==================================================
// FAVICON
// ==================================================

app.get(
  "/favicon.ico",
  function (req, res) {

    const faviconPath =
      path.join(
        adobePath,
        "my-images",
        "illustrator",
        "tshirt.png"
      );

    if (
      !fs.existsSync(
        faviconPath
      )
    ) {

      return res
        .status(204)
        .end();

    }

    return res.sendFile(
      faviconPath
    );

  }
);

// ==================================================
// TEST IMAGE
// ==================================================

app.get(
  "/test-image-4",
  function (req, res) {

    const imagePath =
      path.join(
        adobePath,
        "my-images",
        "techpack",
        "tachpack1 (4).png"
      );

    if (
      !fs.existsSync(
        imagePath
      )
    ) {

      return res
        .status(404)
        .send(
          "IMAGE NOT FOUND"
        );

    }

    return res.sendFile(
      imagePath
    );

  }
);

// ==================================================
// HOME
// ==================================================

app.get(
  "/",
  function (req, res) {

    return res.json({

      success: true,

      message:
        "Yemen Lebs Backend is running"

    });

  }
);

// ==================================================
// API TEST
// ==================================================

app.get(
  "/api/test",
  function (req, res) {

    return res.json({

      success: true,

      message:
        "API is working"

    });

  }
);

// ==================================================
// ADMIN LOGIN
// ==================================================
console.log("ADMIN EMAIL LOADED:", process.env.ADMIN_EMAIL);
console.log(
  "ADMIN PASSWORD LOADED:",
  process.env.ADMIN_PASSWORD ? "YES" : "NO"
);

app.post(
  "/api/admin/login",
  async function (req, res) {

    try {

      const email =
        readTrimmedString(
          req.body.email
        ).toLowerCase();

      const password =
        readTrimmedString(
          req.body.password
        );

      if (
        !email ||
        !password
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Email and password are required"

          });

      }

      if (!isValidEmail(email)) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Please provide a valid email address"

          });

      }

      const adminEmail =
        String(
          process.env.ADMIN_EMAIL
        )
        .trim()
        .toLowerCase();

      if (
        email !== adminEmail ||
        password !==
        process.env.ADMIN_PASSWORD
      ) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              "Invalid admin email or password"

          });

      }

      const token =
        jwt.sign(

          {

            email:
              adminEmail,

            role:
              "admin"

          },

          process.env.JWT_SECRET,

          {

            expiresIn:
              "7d"

          }

        );

      return res.json({

        success: true,

        message:
          "Admin login successful",

        token:
          token,

        admin: {

          email:
            adminEmail,

          role:
            "admin"

        }

      });

    } catch (error) {

      console.error(
        "❌ ADMIN LOGIN ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);

// ==================================================
// CHECK ADMIN
// ==================================================

app.get(
  "/api/admin/me",
  verifyToken,
  verifyAdmin,
  function (req, res) {

    return res.json({

      success: true,

      admin: {

        email:
          req.user.email,

        role:
          req.user.role

      }

    });

  }
);

// ==================================================
// IMAGE UPLOAD
// ==================================================

app.post(
  "/api/upload",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  function (req, res) {

    try {

      if (!req.file) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "No image uploaded"

          });

      }

      const image =
        "adobe/uploads/" +
        req.file.filename;

      const url =
        "/adobe/uploads/" +
        req.file.filename;

      console.log(
        "✅ IMAGE UPLOADED:",
        image
      );

      return res.json({

        success: true,

        message:
          "Image uploaded successfully",

        image:
          image,

        url:
          url,

        filename:
          req.file.filename

      });

    } catch (error) {

      console.error(
        "❌ IMAGE UPLOAD ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);

// ==================================================
// GET PROJECTS
// ==================================================

app.get(
  "/api/projects",
  async function (req, res) {

    try {

      const collection =
        mongoose.connection.db
          .collection("projects");

      const search =
        String(
          req.query.search || ""
        ).trim();

      const category =
        String(
          req.query.category || ""
        )
        .trim()
        .toLowerCase();

      const filter = {};

      if (search) {

        filter.$or = [

          {
            title: {
              $regex: search,
              $options: "i"
            }
          },

          {
            description: {
              $regex: search,
              $options: "i"
            }
          }

        ];

      }

      if (
        category &&
        category !== "all"
      ) {

        filter.category =
          category;

      }

      const projects =
        await collection
          .find(filter)
          .sort({
            createdAt: -1
          })
          .toArray();

      return res.json({

        success: true,

        projects:
          projects,

        total:
          projects.length

      });

    } catch (error) {

      console.error(
        "❌ GET PROJECTS ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);

// ==================================================
// CREATE PROJECT
// ==================================================

app.post(
  "/api/projects",
  verifyToken,
  verifyAdmin,
  async function (req, res) {

    try {

      const title =
        String(
          req.body.title || ""
        ).trim();

      const category =
        String(
          req.body.category || ""
        )
        .trim()
        .toLowerCase();

      const image =
        String(
          req.body.image || ""
        ).trim();

      const description =
        String(
          req.body.description || ""
        ).trim();

      if (!title) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Project title is required"

          });

      }

      if (!category) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Project category is required"

          });

      }

      if (!image) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Project image is required"

          });

      }

      const collection =
        mongoose.connection.db
          .collection("projects");

      const existing =
        await collection.findOne({

          title:
            title,

          image:
            image

        });

      if (existing) {

        return res
          .status(409)
          .json({

            success: false,

            message:
              "This project already exists",

            project:
              existing

          });

      }

      const now =
        new Date();

      const newProject = {

        title:
          title,

        category:
          category,

        image:
          image,

        description:
          description,

        createdAt:
          now,

        updatedAt:
          now

      };

      const result =
        await collection.insertOne(
          newProject
        );

      const project =
        await collection.findOne({

          _id:
            result.insertedId

        });

      // Notification
      await mongoose.connection.db
        .collection("notifications")
        .insertOne({

          type:
            "project",

          title:
            "New Project Added",

          message:
            `"${title}" was added.`,

          read:
            false,

          createdAt:
            now

        });

      return res
        .status(201)
        .json({

          success: true,

          message:
            "Project added successfully",

          project:
            project

        });

    } catch (error) {

      console.error(
        "❌ CREATE PROJECT ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);

// ==================================================
// GET SINGLE PROJECT
// ==================================================

app.get(
  "/api/projects/:id",
  async function (req, res) {

    try {

      const id =
        req.params.id;

      const collection =
        mongoose.connection.db
          .collection("projects");

      let project =
        null;

      if (
        mongoose.Types.ObjectId.isValid(id)
      ) {

        project =
          await collection.findOne({

            _id:
              new mongoose.Types.ObjectId(id)

          });

      }

      if (!project) {

        project =
          await collection.findOne({

            _id:
              id

          });

      }

      if (!project) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Project not found"

          });

      }

      return res.json({

        success: true,

        project:
          project

      });

    } catch (error) {

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);

// ==================================================
// EDIT PROJECT
// ==================================================

app.put(
  "/api/projects/:id",
  verifyToken,
  verifyAdmin,
  async function (req, res) {

    try {

      const id =
        req.params.id;

      const collection =
        mongoose.connection.db
          .collection("projects");

      let project =
        null;

      if (
        mongoose.Types.ObjectId.isValid(id)
      ) {

        project =
          await collection.findOne({

            _id:
              new mongoose.Types.ObjectId(id)

          });

      }

      if (!project) {

        project =
          await collection.findOne({

            _id:
              id

          });

      }

      if (!project) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Project not found"

          });

      }

      const updateData = {};

      if (
        req.body.title !== undefined
      ) {

        updateData.title =
          String(
            req.body.title
          ).trim();

      }

      if (
        req.body.category !== undefined
      ) {

        updateData.category =
          String(
            req.body.category
          )
          .trim()
          .toLowerCase();

      }

      if (
        req.body.image !== undefined
      ) {

        updateData.image =
          String(
            req.body.image
          ).trim();

      }

      if (
        req.body.description !== undefined
      ) {

        updateData.description =
          String(
            req.body.description
          ).trim();

      }

      updateData.updatedAt =
        new Date();

      await collection.updateOne(

        {
          _id:
            project._id
        },

        {
          $set:
            updateData
        }

      );

      const updated =
        await collection.findOne({

          _id:
            project._id

        });

      return res.json({

        success: true,

        message:
          "Project updated successfully",

        project:
          updated

      });

    } catch (error) {

      console.error(
        "❌ UPDATE PROJECT ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);

// ==================================================
// DELETE PROJECT
// ==================================================

app.delete(
  "/api/projects/:id",
  verifyToken,
  verifyAdmin,
  async function (req, res) {

    try {

      const id =
        req.params.id;

      const collection =
        mongoose.connection.db
          .collection("projects");

      let project =
        null;

      if (
        mongoose.Types.ObjectId.isValid(id)
      ) {

        project =
          await collection.findOne({

            _id:
              new mongoose.Types.ObjectId(id)

          });

      }

      if (!project) {

        project =
          await collection.findOne({

            _id:
              id

          });

      }

      if (!project) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Project not found"

          });

      }

      await collection.deleteOne({

        _id:
          project._id

      });

      return res.json({

        success: true,

        message:
          "Project deleted successfully"

      });

    } catch (error) {

      console.error(
        "❌ DELETE PROJECT ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);
// ==================================================
// REVIEWS
// ==================================================

// GET REVIEWS
app.get(
  "/api/reviews",
  async function (req, res) {

    try {

      const reviews =
        await mongoose.connection.db
          .collection("reviews")
          .find({})
          .sort({
            createdAt: -1
          })
          .toArray();

      return res.json({

        success: true,

        reviews:
          reviews,

        total:
          reviews.length

      });

    } catch (error) {

      console.error(
        "❌ GET REVIEWS ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  }
);

// ==========================================
// DELETE REVIEW - ADMIN ONLY
// ==========================================

app.delete(
  "/api/reviews/:id",
  verifyToken,
  verifyAdmin,
  async function (req, res) {

    try {

      const { ObjectId } =
        require("mongodb");

      const id = req.params.id;

      if (!ObjectId.isValid(id)) {

        return res.status(400).json({
          success: false,
          message: "Invalid review ID"
        });

      }

      const result =
        await mongoose.connection.db
          .collection("reviews")
          .deleteOne({
            _id: new ObjectId(id)
          });

      if (result.deletedCount === 0) {

        return res.status(404).json({
          success: false,
          message: "Review not found"
        });

      }

      return res.json({

        success: true,

        message: "Review deleted successfully"

      });

    } catch (error) {

      console.error(
        "❌ DELETE REVIEW ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message: error.message

      });

    }

  }
);
// CREATE REVIEW
app.post(
  "/api/reviews",
  async function (req, res) {

    try {

      const comment =
        String(
          req.body.comment || ""
        ).trim();

      const rating =
        Number(
          req.body.rating
        );

      if (!comment) {

        return res.status(400).json({

          success: false,

          message:
            "Comment is required"

        });

      }

      if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Rating must be between 1 and 5"

        });

      }

      const now =
        new Date();

      const review = {

        rating:
          rating,

        comment:
          comment,

        createdAt:
          now,

        updatedAt:
          now

      };

      const result =
        await mongoose.connection.db
          .collection("reviews")
          .insertOne(review);

      return res.status(201).json({

        success: true,

        message:
          "Review posted successfully",

        review: {

          _id:
            result.insertedId,

          ...review

        }

      });

    } catch (error) {

      console.error(
        "❌ CREATE REVIEW ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  }
);
// ==================================================
// CONTACT
// ==================================================

app.post(
  "/api/contact",
  async function (req, res) {

    try {

      const name =
        readTrimmedString(
          req.body.name
        );

      const email =
        readTrimmedString(
          req.body.email
        ).toLowerCase();

      const subject =
        readTrimmedString(
          req.body.subject
        );

      const message =
        readTrimmedString(
          req.body.message
        );

      if (
        !name ||
        !email ||
        !subject ||
        !message
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "All fields are required"

          });

      }

      if (!isValidEmail(email)) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Please provide a valid email address"

          });

      }

      const now =
        new Date();

      const result =
        await mongoose.connection.db
          .collection("messages")
          .insertOne({

            name:
              name,

            email:
              email,

            subject:
              subject,

            message:
              message,

            read:
              false,

            createdAt:
              now,

            updatedAt:
              now

          });

      return res
        .status(201)
        .json({

          success: true,

          message:
            "Message sent successfully",

          contactId:
            String(
              result.insertedId
            )

        });

    } catch (error) {

      console.error(
        "❌ CONTACT ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);
// ==================================================
// UPLOAD REFERENCE IMAGE (PUBLIC — customer, no admin token)
// Add this BEFORE the "CREATE ORDER" route.
// ==================================================

app.post(
  "/api/orders/upload-reference",
  upload.single("image"),
  function (req, res) {

    try {

      if (!req.file) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "No image uploaded"

          });

      }

      const image =
        "adobe/uploads/" +
        req.file.filename;

      const url =
        "/adobe/uploads/" +
        req.file.filename;

      console.log(
        "✅ REFERENCE IMAGE UPLOADED:",
        image
      );

      return res.json({

        success: true,

        message:
          "Reference image uploaded successfully",

        image:
          image,

        url:
          url,

        filename:
          req.file.filename

      });

    } catch (error) {

      console.error(
        "❌ REFERENCE IMAGE UPLOAD ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);
// ==================================================
// CREATE ORDER (REPLACES your existing POST /api/orders route)
// Now accepts the full design details + reference image URL.
// ==================================================

app.post(
  "/api/orders",
  async function (req, res) {

    try {

      const service =
        readTrimmedString(
          req.body.service
        );

      const packageName =
        readTrimmedString(
          req.body.package
        );

      const name =
        readTrimmedString(
          req.body.name
        );

      const email =
        readTrimmedString(
          req.body.email
        ).toLowerCase();

      const notes =
        readTrimmedString(
          req.body.notes
        );

      const price =
        Number(
          req.body.price
        );

      // ============================
      // NEW — FULL DESIGN DETAILS
      // ============================

      const designType =
        readTrimmedString(
          req.body.designType
        );

      const patternStyle =
        readTrimmedString(
          req.body.patternStyle
        );

      const fileType =
        readTrimmedString(
          req.body.fileType
        );

      const color =
        readTrimmedString(
          req.body.color
        );

      const colorName =
        readTrimmedString(
          req.body.colorName
        );

      const size =
        readTrimmedString(
          req.body.size
        );

      const quantity =
        Number(
          req.body.quantity ?? 1
        );

      const additionalInstructions =
        readTrimmedString(
          req.body.additionalInstructions
        );

      const referenceImage =
        readTrimmedString(
          req.body.referenceImage
        );

      if (
        !service ||
        !packageName ||
        !name ||
        !email
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Service, package, name and email are required"

          });

      }

      if (!isValidEmail(email)) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Please provide a valid email address"

          });

      }

      if (!isPositiveNumber(price, 0)) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Valid price is required"

          });

      }

      if (!isPositiveNumber(quantity, 1)) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Quantity must be at least 1"

          });

      }

      const now =
        new Date();

      const order = {

        service:
          service,

        package:
          packageName,

        price:
          price,

        name:
          name,

        email:
          email,

        notes:
          notes,

        // NEW — full design details saved with the order
        designType:
          designType,

        patternStyle:
          patternStyle,

        fileType:
          fileType,

        color:
          color,

        colorName:
          colorName,

        size:
          size,

        quantity:
          quantity,

        additionalInstructions:
          additionalInstructions,

        referenceImage:
          referenceImage,

        status:
          "Pending",

        viewed:
          false,

        createdAt:
          now,

        updatedAt:
          now

      };

      const result =
        await mongoose.connection.db
          .collection("orders")
          .insertOne(order);

      // 🔔 Notification
      await mongoose.connection.db
        .collection("notifications")
        .insertOne({

          type:
            "order",

          title:
            "New Customer Order",

          message:
            `${name} placed a new order for ${service}.`,

          orderId:
            result.insertedId,

          read:
            false,

          createdAt:
            now

        });

      console.log(
        "✅ ORDER SAVED:",
        String(
          result.insertedId
        )
      );

      return res
        .status(201)
        .json({

          success: true,

          message:
            "Order placed successfully",

          orderId:
            String(
              result.insertedId
            )

        });

    } catch (error) {

      console.error(
        "❌ CREATE ORDER ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);
// ==================================================
// GET ORDERS
// ==================================================

app.get(
  "/api/orders",
  async function (req, res) {

    try {

      const status =
        String(
          req.query.status || ""
        ).trim();

      const search =
        String(
          req.query.search || ""
        ).trim();

      const filter = {};

      if (
        status &&
        status !== "All"
      ) {

        filter.status =
          status;

      }

      if (search) {

        filter.$or = [

          {
            name: {
              $regex: search,
              $options: "i"
            }
          },

          {
            email: {
              $regex: search,
              $options: "i"
            }
          },

          {
            service: {
              $regex: search,
              $options: "i"
            }
          },

          {
            package: {
              $regex: search,
              $options: "i"
            }
          }

        ];

      }

      const orders =
        await mongoose.connection.db
          .collection("orders")
          .find(filter)
          .sort({
            createdAt: -1
          })
          .toArray();

      return res.json({

        success: true,

        orders:
          orders,

        total:
          orders.length

      });

    } catch (error) {

      console.error(
        "❌ GET ORDERS ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);

// ==================================================
// UPDATE ORDER STATUS
// ==================================================

app.patch(
  "/api/orders/:id/status",
  verifyToken,
  verifyAdmin,
  async function (req, res) {

    try {

      const id =
        String(
          req.params.id || ""
        ).trim();

      const newStatus =
        String(
          req.body.status || ""
        ).trim();

      const allowedStatuses = [

        "Pending",

        "In Progress",

        "Completed",

        "Cancelled"

      ];

      if (
        !allowedStatuses.includes(
          newStatus
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid order status"

          });

      }

      const orders =
        mongoose.connection.db
          .collection("orders");

      let order =
        null;

      if (
        mongoose.Types.ObjectId.isValid(id)
      ) {

        order =
          await orders.findOne({

            _id:
              new mongoose.Types.ObjectId(id)


              
          });

      }

      if (!order) {

        order =
          await orders.findOne({

            _id:
              id

          });

      }

      if (!order) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Order not found"

          });

      }

      await orders.updateOne(

        {
          _id:
            order._id
        },

        {
          $set: {

            status:
              newStatus,

            updatedAt:
              new Date()

          }

        }

      );

      const updatedOrder =
        await orders.findOne({

          _id:
            order._id

        });

      return res.json({

        success: true,

        message:
          "Order status updated successfully",

        order:
          updatedOrder

      });

    } catch (error) {

      console.error(
        "❌ ORDER STATUS ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);
// ==================================================
// MARK ORDER AS VIEWED
// Add this AFTER the "UPDATE ORDER STATUS" route.
// ==================================================

app.patch(
  "/api/orders/:id/viewed",
  verifyToken,
  verifyAdmin,
  async function (req, res) {

    try {

      const id =
        String(
          req.params.id || ""
        ).trim();

      const orders =
        mongoose.connection.db
          .collection("orders");

      let order =
        null;

      if (
        mongoose.Types.ObjectId.isValid(id)
      ) {

        order =
          await orders.findOne({

            _id:
              new mongoose.Types.ObjectId(id)

          });

      }

      if (!order) {

        order =
          await orders.findOne({

            _id:
              id

          });

      }

      if (!order) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Order not found"

          });

      }

      await orders.updateOne(

        {
          _id:
            order._id
        },

        {
          $set: {

            viewed:
              true,

            viewedAt:
              new Date()

          }

        }

      );

      const updatedOrder =
        await orders.findOne({

          _id:
            order._id

        });

      return res.json({

        success: true,

        message:
          "Order marked as viewed",

        order:
          updatedOrder

      });

    } catch (error) {

      console.error(
        "❌ ORDER VIEWED ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);

// ==================================================
// ADMIN STATISTICS
// ==================================================

app.get(
  "/api/admin/statistics",
  verifyToken,
  verifyAdmin,
  async function (req, res) {

    try {

      const db =
        mongoose.connection.db;

      const projects =
        await db
          .collection("projects")
          .countDocuments();

      const orders =
        await db
          .collection("orders")
          .find({})
          .toArray();

      const completed =
        orders.filter(
          order =>
            order.status ===
            "Completed"
        );

      const pending =
        orders.filter(
          order =>
            order.status ===
            "Pending"
        );

      const inProgress =
        orders.filter(
          order =>
            order.status ===
            "In Progress"
        );

      const cancelled =
        orders.filter(
          order =>
            order.status ===
            "Cancelled"
        );

      const revenue =
        completed.reduce(

          function (total, order) {

            return (
              total +
              Number(
                order.price || 0
              )
            );

          },

          0

        );

      return res.json({

        success: true,

        statistics: {

          projects:
            projects,

          totalOrders:
            orders.length,

          completedOrders:
            completed.length,

          pendingOrders:
            pending.length,

          inProgressOrders:
            inProgress.length,

          cancelledOrders:
            cancelled.length,

          revenue:
            revenue

        }

      });

    } catch (error) {

      console.error(
        "❌ STATISTICS ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);

// ==================================================
// NOTIFICATIONS
// ==================================================

app.get(
  "/api/admin/notifications",
  verifyToken,
  verifyAdmin,
  async function (req, res) {

    try {

      const notifications =
        await mongoose.connection.db
          .collection("notifications")
          .find({})
          .sort({
            createdAt: -1
          })
          .limit(50)
          .toArray();

      const unread =
        notifications.filter(
          notification =>
            notification.read !== true
        ).length;

      return res.json({

        success: true,

        notifications:
          notifications,

        unread:
          unread

      });

    } catch (error) {

      console.error(
        "❌ NOTIFICATIONS ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);
// ==================================================
// MARK NOTIFICATION AS READ
// ==================================================

app.patch(
  "/api/admin/notifications/:id/read",
  verifyToken,
  verifyAdmin,
  async function (req, res) {

    try {

      const id =
        String(req.params.id || "").trim();

      const notifications =
        mongoose.connection.db
          .collection("notifications");

      let notification = null;

      // ObjectId
      if (
        mongoose.Types.ObjectId.isValid(id)
      ) {

        notification =
          await notifications.findOne({
            _id:
              new mongoose.Types.ObjectId(id)
          });

      }

      // String ID fallback
      if (!notification) {

        notification =
          await notifications.findOne({
            _id: id
          });

      }

      if (!notification) {

        return res
          .status(404)
          .json({
            success: false,
            message: "Notification not found"
          });

      }

      await notifications.updateOne(
        {
          _id: notification._id
        },
        {
          $set: {
            read: true,
            readAt: new Date()
          }
        }
      );

      return res.json({
        success: true,
        message: "Notification marked as read"
      });

    } catch (error) {

      console.error(
        "❌ READ NOTIFICATION ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message: error.message
        });

    }

  }
);
// ==================================================
// CUSTOMER REGISTER
// ==================================================

app.post(
  "/api/auth/register",
  async function (req, res) {

    try {

      const firstName =
        readTrimmedString(
          req.body.firstName
        );

      const lastName =
        readTrimmedString(
          req.body.lastName
        );

      const email =
        readTrimmedString(
          req.body.email
        ).toLowerCase();

      const password =
        readTrimmedString(
          req.body.password
        );

      if (
        !firstName ||
        !lastName ||
        !email ||
        !password
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "All fields are required"

          });

      }

      if (firstName.length < 2 || lastName.length < 2) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "First and last name must be at least 2 characters"

          });

      }

      if (!isValidEmail(email)) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Please provide a valid email address"

          });

      }

      if (
        password.length < 6
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Password must be at least 6 characters"

          });

      }

      const users =
        mongoose.connection.db
          .collection("users");

      const existing =
        await users.findOne({

          email:
            email

        });

      if (existing) {

        return res
          .status(409)
          .json({

            success: false,

            message:
              "An account with this email already exists"

          });

      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          12
        );

      const customerId =
        "CUS-" +
        Date.now().toString().slice(-8);

      const user = {

        customerId:
          customerId,

        firstName:
          firstName,

        lastName:
          lastName,

        email:
          email,

        password:
          hashedPassword,

        role:
          "user",

        createdAt:
          new Date()

      };

      const result =
        await users.insertOne(
          user
        );

      const token =
        jwt.sign(

          {

            userId:
              result.insertedId.toString(),

            email:
              email,

            role:
              "user"

          },

          process.env.JWT_SECRET,

          {
            expiresIn:
              "7d"
          }

        );

      return res
        .status(201)
        .json({

          success: true,

          message:
            "Account created successfully",

          token:
            token,

          user: {

            id:
              result.insertedId,

            customerId:
              customerId,

            firstName:
              firstName,

            lastName:
              lastName,

            email:
              email,

            role:
              "user"

          }

        });

    } catch (error) {

      console.error(
        "❌ REGISTER ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);

// ==================================================
// CUSTOMER LOGIN
// ==================================================

app.post(
  "/api/auth/login",
  async function (req, res) {

    try {

      const email =
        readTrimmedString(
          req.body.email
        ).toLowerCase();

      const password =
        readTrimmedString(
          req.body.password
        );

      if (!email || !password) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Email and password are required"

          });

      }

      if (!isValidEmail(email)) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Please provide a valid email address"

          });

      }

      const users =
        mongoose.connection.db
          .collection("users");

      const user =
        await users.findOne({

          email:
            email

        });

      if (!user) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              "Invalid email or password"

          });

      }

      const match =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!match) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              "Invalid email or password"

          });

      }

      const token =
        jwt.sign(

          {

            userId:
              user._id.toString(),

            email:
              user.email,

            role:
              user.role

          },

          process.env.JWT_SECRET,

          {
            expiresIn:
              "7d"
          }

        );

      return res.json({

        success: true,

        message:
          "Login successful",

        token:
          token,

        user: {

          id:
            user._id,

          firstName:
            user.firstName,

          lastName:
            user.lastName,

          email:
            user.email,

          role:
            user.role

        }

      });

    } catch (error) {

      console.error(
        "❌ LOGIN ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);

// ==================================================
// 404
// ==================================================

app.use(
  function (req, res) {

    console.log(
      "❌ ROUTE NOT FOUND:",
      req.method,
      req.originalUrl
    );

    return res
      .status(404)
      .json({

        success: false,

        message:
          "Route not found",

        method:
          req.method,

        path:
          req.originalUrl

      });

  }
);

// ==================================================
// ERROR HANDLER
// ==================================================

app.use(
  function (error, req, res, next) {

    console.error(
      "❌ SERVER ERROR:",
      error
    );

    return res
      .status(500)
      .json({

        success: false,

        message:
          error.message ||
          "Server error"

      });

  }
);

// ==================================================
// MONGODB
// ==================================================

console.log("");
console.log(
  "🔌 CONNECTING TO MONGODB..."
);

mongoose
  .connect(
    process.env.MONGO_URI
  )

  .then(
    function () {

      console.log("");
      console.log(
        "========================================"
      );

      console.log(
        "✅ MONGODB CONNECTED"
      );

      console.log(
        "🗄️ DATABASE:",
        mongoose.connection.name
      );

      console.log(
        "========================================"
      );

      app.listen(
        PORT,
        function () {

          console.log("");
          console.log(
            "========================================"
          );

          console.log(
            "🚀 YEMEN LEBS SERVER RUNNING"
          );

          console.log(
            "🌐 http://localhost:" +
            PORT
          );

          console.log(
            "🧪 API:",
            "http://localhost:" +
            PORT +
            "/api/test"
          );

          console.log(
            "🔐 ADMIN LOGIN:",
            "POST /api/admin/login"
          );

          console.log(
            "🖼️ UPLOAD:",
            "POST /api/upload"
          );

          console.log(
            "✏️ EDIT PROJECT:",
            "PUT /api/projects/:id"
          );

          console.log(
            "💰 STATISTICS:",
            "GET /api/admin/statistics"
          );

          console.log(
            "🔔 NOTIFICATIONS:",
            "GET /api/admin/notifications"
          );

          console.log(
            "========================================"
          );

        }

      );

    }

  )

  .catch(
    function (error) {

      console.error("");
      console.error(
        "❌ MONGODB CONNECTION FAILED"
      );

      console.error(
        error
      );

      process.exit(1);

    }
  );