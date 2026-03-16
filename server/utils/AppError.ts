interface ValidationError {
    field: string;
    message: string;
}

// Type guard to check if an array contains ValidationError objects
function isValidationErrorArray(arr: any[]): arr is ValidationError[] {
    return arr.every(
        item => item && 
        typeof item === 'object' && 
        typeof item.field === 'string' && 
        typeof item.message === 'string'
    );
}

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly status: string;
    public readonly isOperational: boolean;
    public readonly details?: any;
    public readonly errors?: ValidationError[];

    constructor(message: string, statusCode: number, detailsOrErrors?: any) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Operational errors are trusted (e.g. input validation)
        
        // Support both details and errors parameters with proper type checking
        if (Array.isArray(detailsOrErrors) && isValidationErrorArray(detailsOrErrors)) {
            this.errors = detailsOrErrors;
        } else if (detailsOrErrors !== undefined) {
            this.details = detailsOrErrors;
        }

        Error.captureStackTrace(this, this.constructor);
    }
}
