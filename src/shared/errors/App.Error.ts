
export class AppError extends Error{

    public readonly statusCode: number;
    public readonly isOperational: boolean;


    constructor(message: string, statusCode:number)
    {
        super(message);

        this.statusCode= statusCode;
        this.isOperational = true;
        this.name = this.constructor.name;

        Error.captureStackTrace(this,this.constructor);
    }
}


export class AuthError extends AppError{

    constructor(message:string="Authentication failed"){
        super(message,401);
    }
}



export class PermissionError extends AppError{

    constructor ( message:string="Permission denied")
    {
        super(message,403);
    }
}

export class NotFoundError extends AppError{
    constructor(message:string="Resource not found"){
        super(message,404);
    }   
}

export class ValidationError extends AppError{

    constructor(message:string="Validation failed"){
        super(message,400);
    }   
}

export class ConflictError extends AppError{
    constructor(message:string="Conflict occurred"){
        super(message,409);
    }   
}