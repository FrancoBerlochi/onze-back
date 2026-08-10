"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const express_1 = require("express");
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
const getProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching products' });
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({ where: { id } });
        if (product) {
            res.json(product);
        }
        else {
            res.status(404).json({ error: 'Product not found' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching product' });
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    try {
        const productData = req.body;
        const newProduct = await prisma.product.create({
            data: productData,
        });
        res.status(201).json(newProduct);
    }
    catch (error) {
        res.status(500).json({ error: 'Error creating product' });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productData = req.body;
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: productData,
        });
        res.json(updatedProduct);
    }
    catch (error) {
        res.status(500).json({ error: 'Error updating product' });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({ where: { id } });
        res.json({ message: 'Product deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting product' });
    }
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=product.controller.js.map