import { Router, Response } from 'express';
import { Types } from 'mongoose';

import cartController from './controllers';
import productController from './../product/controllers';
import orderController from './../order/controllers';

import { AuthRequest } from '../../shared/types';
import { successResponse } from '../../shared/utils';
import { validateRequestBody } from '../../shared/middleware';
import { CartAddBodyValidator } from './validator';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new Error('Login Required');
    }

    // TODO: add info of total price of cart products
    const cart = await cartController
        .getOne({ userId }, '-createdAt -updatedAt -userId -cartProducts._id -cartProducts.createdAt -cartProducts.updatedAt')
        .populate('cartProducts.productId', 'name price brand');
    if (!cart) {
        throw new Error('Please Create Cart First');
    }

    return res.send(successResponse({ data: cart }));
});

router.post('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new Error('Login Required');
    }

    const cartExists = await cartController.exists({ userId });
    if (cartExists) {
        throw new Error('Cart already exists');
    }

    const newCart = await cartController.create({ userId });
    return res.send(successResponse({ data: newCart.toObject() }));
});

router.put('/', CartAddBodyValidator, validateRequestBody, async (req: AuthRequest, res: Response) => {
    // TODO: add limit of 10 product in cart
    // NOTE: to add product to cart
    const userId = req.user?._id;
    if (!userId) {
        throw new Error('Login Required');
    }
    const { productId } = req.body;

    // 1. Check product exists
    const productExists = await productController.exists({ _id: productId });
    if (!productExists) {
        throw new Error('Invalid Product');
    }

    // 2. Check for user cart exists
    const userCartExists = await cartController.exists({ userId });
    if (!userCartExists) {
        throw new Error('Please Create Cart First');
    }

    // 3. Checking if Product is already available in cart
    const productExistsInCart = await cartController.exists({ userId, 'cartProducts.productId': productId });
    if (productExistsInCart) {
        await cartController.updateOne({ userId, 'cartProducts.productId': productId }, { $inc: { 'cartProducts.$.quantity': 1 } });
        return res.send(successResponse({ message: 'Updated Product Quantity' }));
    }
    // 4 - If Product is not available in cart
    await cartController.updateOne({ userId }, { $push: { cartProducts: { productId, quantity: 1 } } });
    return res.send(successResponse({ message: 'Added Product to Cart' }));
});

router.delete('/products/:productId', async (req: AuthRequest, res: Response) => {
    // NOTE: to remove product from cart
    const userId = req.user?._id;
    if (!userId) {
        throw new Error('Login Required');
    }
    const { productId } = req.params;

    const cartProduct = await cartController.getOne({ userId, 'products.productId': productId });
    if (!cartProduct) {
        throw new Error('Product not in Cart');
    }
    const productQuantity = cartProduct.cartProducts[0].quantity;

    // 1. If product quantity in cart === 1
    if (productQuantity === 1) {
        await cartController.updateOne({ userId }, { $pull: { products: { productId } } });
        return res.send(successResponse({ message: 'Removed Product from Cart' }));
    }
    // 2. If product quantity in cart > 1
    await cartController.updateOne({ userId, 'products.productId': productId }, { $inc: { 'products.$.quantity': -1 } });
    return res.send(successResponse({ message: 'Decreased Product Quantity' }));
});

router.post('/checkout', async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id || '';
    const userCart = await cartController
        .getOne({ userId }, '-createdAt -updatedAt -products._id -products.createdAt -products.updatedAt')
        .populate('cartProducts.productId', 'name price brand');

    if (!userCart) {
        throw new Error("Cart doesn't exists");
    }

    if (userCart.cartProducts.length === 0) {
        throw new Error('Cart is Empty');
    }

    const productsInfo = userCart.cartProducts.map((product) => {
        if (product.productId == null || product.productId instanceof Types.ObjectId) {
            throw new Error('should be populated');
        }
        return {
            productId: product.productId._id,
            quantity: product.quantity,
            price: product.productId.price,
        };
    });

    await orderController.create({ userId, orderedProducts: productsInfo });
    await cartController.deleteOne({ userId });

    return res.send(successResponse({ message: 'Successfully Ordered' }));
});

router.delete('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new Error('Login Required');
    }

    const userCartExists = await cartController.exists({ userId });
    if (!userCartExists) {
        throw new Error('Cart does not exists');
    }

    await cartController.deleteOne({ userId });
    return res.send(successResponse({ message: 'Cart Emptied' }));
});

export default router;
