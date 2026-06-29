const express = require("express");
const router = express.Router();
const Product = require("../model/Product.js");

const categories = [
  "Electronics",
  "Books",
  "Fashion",
  "Shoes",
  "Sports",
  "Home",
  "Kitchen",
  "Gaming",
  "Health",
  "Beauty",
];

const randomCategory = () => {
  return categories[Math.floor(Math.random() * categories.length)];
};

const randomPrice = () => {
  return Math.floor(Math.random() * 10000) + 1;
};

const generateProduct = (count) => {
  let products = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    products.push({
      unique_id: `PROD-${now}-${i}-${Math.floor(Math.random() * 1000)}`,
      name: `Product ${i + 1}`,
      category: randomCategory(),
      price: randomPrice(),
      created_at: new Date(now - Math.floor(Math.random() * 1000000000)),
      updated_at: new Date(now - Math.floor(Math.random() * 1000000000)),
    });
  }

  return products;
};

const encodeCursor = (payload) => {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
};

const decodeCursor = (cursor) => {
  const decoded = Buffer.from(cursor, "base64").toString("utf-8");
  return JSON.parse(decoded);
};

// @route GET /api/product
// @desc Get all products
// @access Public
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor;
    const category = req.query.category;

    let snapshotAt = new Date();
    let cursorQuery = {};

    if (cursor) {
      const decoded = decodeCursor(cursor);

      if (decoded?.snapshotAt && decoded?.created_at && decoded?.unique_id) {
        snapshotAt = new Date(decoded.snapshotAt);

        cursorQuery = {
          $or: [
            { created_at: { $lt: new Date(decoded.created_at) } },
            {
              created_at: new Date(decoded.created_at),
              unique_id: { $lt: decoded.unique_id },
            },
          ],
        };
      }
    }

    const filterQuery = category ? { category } : {};

    const query = {
      ...filterQuery,
      ...cursorQuery,
      created_at: { $lte: snapshotAt },
    };

    const products = await Product.find(query)
      .sort({ created_at: -1, unique_id: -1 })
      .limit(limit + 1);

    let nextCursor = null;

    if (products.length > limit) {
      const nextItem = products[limit];

      nextCursor = encodeCursor({
        created_at: nextItem.created_at,
        unique_id: nextItem.unique_id,
        snapshotAt,
      });

      products.pop();
    }

    res.json({
      products,
      nextCursor,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route POST /api/product
// @desc Create a new product
// @access Public
router.post("/", async (req, res) => {
  try {
    const { unique_id, name, price, category } = req.body;

    if (!unique_id || !name || !price || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newProduct = new Product({
      unique_id,
      name,
      price,
      category,
    });

    const saved = await newProduct.save();

    res.status(201).json({
      message: "Product created successfully",
      product: saved,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route POST /api/product/add-50
// @desc Addd random 50 products
// @access Public
router.post("/add-50", async (req, res) => {
  try {
    const products = generateProduct(50);

    const saveProduct = await Product.insertMany(products, {
      ordered: false,
    });

    res.status(201).json({
      message: "50 products added successfully",
      products: saveProduct,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route PATCH /api/product
// @desc Update a product by unique_id
// @access Public
router.patch("/", async (req, res) => {
  try {
    const { unique_id, name, price, category } = req.body;

    if (!unique_id) {
      return res.status(400).json({ message: "unique_id is required" });
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (price) updateFields.price = price;
    if (category) updateFields.category = category;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        message:
          "At least one field (name, price, category) is required to update",
      });
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { unique_id },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
