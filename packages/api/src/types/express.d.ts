// Type definitions for Express extensions
// This file extends the Express namespace to include custom properties

declare global {
    namespace Express {
        interface Request {
            user?: any;
            ip: string;
            path: string;
        }
        interface Response {
            status(code: number): this;
            json(data: any): this;
        }
    }
}

export { };
