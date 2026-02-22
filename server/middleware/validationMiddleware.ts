import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../utils/AppError.js';

/**
 * Validation middleware factory
 */
export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return next(new AppError(
                `Validation error: ${errors.map(e => e.message).join(', ')}`,
                422,
                errors
            ));
        }

        // Replace request body with validated value
        req.body = value;
        next();
    };
};

/**
 * Validation schemas for common entities
 */

// Project schemas
export const createProjectSchema = Joi.object({
    name: Joi.string().required().min(1).max(255),
    description: Joi.string().allow('').max(5000),
    status: Joi.string().valid('active', 'completed', 'on_hold', 'cancelled').default('active'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')),
    budget: Joi.number().positive().allow(null),
    companyId: Joi.string().uuid(),
    address: Joi.string().allow('').max(500),
    city: Joi.string().allow('').max(100),
    state: Joi.string().allow('').max(50),
    zipCode: Joi.string().allow('').max(20),
    weatherLocation: Joi.object().allow(null)
});

export const updateProjectSchema = Joi.object({
    name: Joi.string().min(1).max(255),
    description: Joi.string().allow('').max(5000),
    status: Joi.string().valid('active', 'completed', 'on_hold', 'cancelled'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    budget: Joi.number().positive().allow(null),
    address: Joi.string().allow('').max(500),
    city: Joi.string().allow('').max(100),
    state: Joi.string().allow('').max(50),
    zipCode: Joi.string().allow('').max(20),
    weatherLocation: Joi.object().allow(null)
}).min(1);

// Task schemas
export const createTaskSchema = Joi.object({
    title: Joi.string().required().min(1).max(255),
    description: Joi.string().allow('').max(5000),
    projectId: Joi.string().uuid().required(),
    assigneeId: Joi.string().uuid().allow(null),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'blocked', 'cancelled').default('pending'),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    dueDate: Joi.date().iso().allow(null),
    estimatedHours: Joi.number().positive().allow(null),
    dependencies: Joi.array().items(Joi.string().uuid()),
    tags: Joi.array().items(Joi.string().max(50))
});

export const updateTaskSchema = Joi.object({
    title: Joi.string().min(1).max(255),
    description: Joi.string().allow('').max(5000),
    assigneeId: Joi.string().uuid().allow(null),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'blocked', 'cancelled'),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    dueDate: Joi.date().iso().allow(null),
    estimatedHours: Joi.number().positive().allow(null),
    actualHours: Joi.number().positive().allow(null),
    completedAt: Joi.date().iso().allow(null),
    dependencies: Joi.array().items(Joi.string().uuid()),
    tags: Joi.array().items(Joi.string().max(50))
}).min(1);

// User schemas
export const createUserSchema = Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().required().min(1).max(255),
    password: Joi.string().min(8).max(128).required(),
    phone: Joi.string().allow('').max(20),
    role: Joi.string().valid('SUPERADMIN', 'COMPANY_ADMIN', 'PROJECT_MANAGER', 'FOREMAN', 'OPERATIVE').default('OPERATIVE'),
    companyId: Joi.string().uuid()
});

export const updateUserSchema = Joi.object({
    name: Joi.string().min(1).max(255),
    phone: Joi.string().allow('').max(20),
    email: Joi.string().email(),
    role: Joi.string().valid('SUPERADMIN', 'COMPANY_ADMIN', 'PROJECT_MANAGER', 'FOREMAN', 'OPERATIVE')
}).min(1);

// Company schemas
export const createCompanySchema = Joi.object({
    name: Joi.string().required().min(1).max(255),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('').max(20),
    address: Joi.string().allow('').max(500),
    city: Joi.string().allow('').max(100),
    state: Joi.string().allow('').max(50),
    zipCode: Joi.string().allow('').max(20),
    website: Joi.string().uri().allow('').max(255)
});

export const updateCompanySchema = Joi.object({
    name: Joi.string().min(1).max(255),
    email: Joi.string().email(),
    phone: Joi.string().allow('').max(20),
    address: Joi.string().allow('').max(500),
    city: Joi.string().allow('').max(100),
    state: Joi.string().allow('').max(50),
    zipCode: Joi.string().allow('').max(20),
    website: Joi.string().uri().allow('').max(255)
}).min(1);

// Daily Log schemas
export const createDailyLogSchema = Joi.object({
    projectId: Joi.string().uuid().required(),
    date: Joi.date().iso().required(),
    weather: Joi.string().allow('').max(100),
    temperature: Joi.number().allow(null),
    workPerformed: Joi.string().required().min(1).max(5000),
    equipmentUsed: Joi.array().items(Joi.string().max(255)),
    laborHours: Joi.number().positive().required(),
    materialDeliveries: Joi.string().allow('').max(2000),
    safetyNotes: Joi.string().allow('').max(2000),
    photos: Joi.array().items(Joi.string().uri())
});

export const updateDailyLogSchema = Joi.object({
    date: Joi.date().iso(),
    weather: Joi.string().allow('').max(100),
    temperature: Joi.number().allow(null),
    workPerformed: Joi.string().min(1).max(5000),
    equipmentUsed: Joi.array().items(Joi.string().max(255)),
    laborHours: Joi.number().positive(),
    materialDeliveries: Joi.string().allow('').max(2000),
    safetyNotes: Joi.string().allow('').max(2000),
    photos: Joi.array().items(Joi.string().uri())
}).min(1);

// RFI schemas
export const createRFISchema = Joi.object({
    projectId: Joi.string().uuid().required(),
    title: Joi.string().required().min(1).max(255),
    description: Joi.string().required().min(1).max(5000),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    submittedBy: Joi.string().uuid().required(),
    assignedTo: Joi.string().uuid().allow(null),
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').default('open'),
    dueDate: Joi.date().iso().allow(null)
});

export const updateRFISchema = Joi.object({
    title: Joi.string().min(1).max(255),
    description: Joi.string().min(1).max(5000),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    assignedTo: Joi.string().uuid().allow(null),
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed'),
    dueDate: Joi.date().iso().allow(null),
    response: Joi.string().allow('').max(5000),
    resolvedAt: Joi.date().iso().allow(null)
}).min(1);

// Safety Incident schemas
export const createSafetyIncidentSchema = Joi.object({
    projectId: Joi.string().uuid().required(),
    type: Joi.string().required().valid('injury', 'near_miss', 'property_damage', 'environmental'),
    severity: Joi.string().required().valid('low', 'medium', 'high', 'critical'),
    description: Joi.string().required().min(1).max(5000),
    date: Joi.date().iso().required(),
    time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    location: Joi.string().required().min(1).max(500),
    involvedPersons: Joi.array().items(Joi.string().uuid()),
    witnesses: Joi.array().items(Joi.string().max(255)),
    immediateAction: Joi.string().allow('').max(2000),
    photos: Joi.array().items(Joi.string().uri()),
    reportedBy: Joi.string().uuid().required()
});

export const updateSafetyIncidentSchema = Joi.object({
    type: Joi.string().valid('injury', 'near_miss', 'property_damage', 'environmental'),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical'),
    description: Joi.string().min(1).max(5000),
    date: Joi.date().iso(),
    time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    location: Joi.string().min(1).max(500),
    involvedPersons: Joi.array().items(Joi.string().uuid()),
    witnesses: Joi.array().items(Joi.string().max(255)),
    immediateAction: Joi.string().allow('').max(2000),
    correctiveActions: Joi.string().allow('').max(2000),
    status: Joi.string().valid('open', 'investigating', 'resolved', 'closed'),
    photos: Joi.array().items(Joi.string().uri())
}).min(1);

// Auth schemas
export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

export const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    name: Joi.string().required().min(1).max(255),
    companyName: Joi.string().required().min(1).max(255),
    phone: Joi.string().allow('').max(20)
});

export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
        .messages({ 'any.only': 'Passwords must match' })
});

export const resetPasswordSchema = Joi.object({
    email: Joi.string().email().required()
});

// Query parameter validation
export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20)
});

export const searchSchema = Joi.object({
    q: Joi.string().min(1).max(255),
    ...paginationSchema.describe().keys
});
