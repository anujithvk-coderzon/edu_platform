import type { CreateModuleInput, ReorderModuleInput, UpdateModuleInput } from "./modules.validation";
/**
 * Course chapters (`courseModule`). Access rules carried over verbatim:
 * an "Admin" role bypasses every ownership check, anyone else must own the
 * course (creator) and, on write paths, may also be its assigned tutor.
 */
type UserRole = string | undefined;
export declare const getCourseModulesService: (courseId: string, userId: string, userRole: UserRole) => Promise<{
    modules: ({
        materials: {
            id: string;
            createdAt: Date;
            type: import("../../../generated/prisma/enums").MaterialType;
            title: string;
            orderIndex: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        courseId: string;
        orderIndex: number;
    })[];
}>;
export declare const getModuleByIdService: (id: string, userId: string, userRole: UserRole) => Promise<{
    module: {
        materials: ({
            author: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("../../../generated/prisma/enums").MaterialType;
            description: string | null;
            title: string;
            isPublic: boolean;
            courseId: string;
            fileUrl: string | null;
            content: string | null;
            orderIndex: number;
            moduleId: string | null;
            authorId: string;
        })[];
        course: {
            id: string;
            title: string;
            creatorId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        courseId: string;
        orderIndex: number;
    };
}>;
export declare const createModuleService: (input: CreateModuleInput, userId: string, userRole: UserRole) => Promise<{
    module: {
        materials: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("../../../generated/prisma/enums").MaterialType;
            description: string | null;
            title: string;
            isPublic: boolean;
            courseId: string;
            fileUrl: string | null;
            content: string | null;
            orderIndex: number;
            moduleId: string | null;
            authorId: string;
        }[];
        course: {
            id: string;
            title: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        courseId: string;
        orderIndex: number;
    };
}>;
export declare const updateModuleService: (id: string, input: UpdateModuleInput, userId: string, userRole: UserRole) => Promise<{
    module: {
        materials: {
            id: string;
            type: import("../../../generated/prisma/enums").MaterialType;
            title: string;
            orderIndex: number;
        }[];
        course: {
            id: string;
            title: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        courseId: string;
        orderIndex: number;
    };
}>;
export declare const deleteModuleService: (id: string, userId: string, userRole: UserRole) => Promise<void>;
export declare const reorderModuleService: (id: string, input: ReorderModuleInput, userId: string, userRole: UserRole) => Promise<{
    module: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        courseId: string;
        orderIndex: number;
    };
}>;
export {};
