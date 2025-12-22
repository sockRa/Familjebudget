import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidateTarget = 'body' | 'params' | 'query';

const createValidator = (target: ValidateTarget) => {
    return (schema: ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await schema.parseAsync(req[target]);
            // Replace with parsed/transformed data
            (req as any)[target] = data;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    error: 'Valideringsfel',
                    details: error.issues.map((err) => ({
                        path: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            next(error);
        }
    };
};

export const validate = createValidator('body');
export const validateParams = createValidator('params');
export const validateQuery = createValidator('query');

// Combined validator for multiple targets
export const validateAll = (schemas: {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
}) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body);
            }
            if (schemas.params) {
                (req as any).params = await schemas.params.parseAsync(req.params);
            }
            if (schemas.query) {
                (req as any).query = await schemas.query.parseAsync(req.query);
            }
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    error: 'Valideringsfel',
                    details: error.issues.map((err) => ({
                        path: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            next(error);
        }
    };
};
