const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    unique_id: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

productSchema.index({ created_at: -1, unique_id: -1 });

productSchema.index({ category: 1, created_at: -1, unique_id: -1 });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
