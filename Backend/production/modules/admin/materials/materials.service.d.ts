import { MaterialType } from "../../../generated/prisma/client";
import type { CreateMaterialInput, UpdateMaterialInput } from "./materials.validation";
/** The staff member performing the action: an Admin or a Tutor. */
export interface Caller {
    id: string;
    role?: "Admin" | "Tutor";
}
export declare const getCourseMaterialsService: (courseId: string) => Promise<{
    materials: ({
        module: {
            id: string;
            title: string;
        };
        author: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: MaterialType;
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
}>;
export declare const getMaterialByIdService: (callerId: string, materialId: string) => Promise<{
    material: {
        course: {
            id: string;
            title: string;
            creatorId: string;
        };
        module: {
            id: string;
            title: string;
        };
        author: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: MaterialType;
        description: string | null;
        title: string;
        isPublic: boolean;
        courseId: string;
        fileUrl: string | null;
        content: string | null;
        orderIndex: number;
        moduleId: string | null;
        authorId: string;
    };
}>;
export declare const createMaterialService: (caller: Caller, input: CreateMaterialInput) => Promise<{
    material: {
        module: {
            id: string;
            title: string;
        };
        author: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: MaterialType;
        description: string | null;
        title: string;
        isPublic: boolean;
        courseId: string;
        fileUrl: string | null;
        content: string | null;
        orderIndex: number;
        moduleId: string | null;
        authorId: string;
    };
}>;
export declare const updateMaterialService: (caller: Caller, materialId: string, input: UpdateMaterialInput) => Promise<{
    material: {
        module: {
            id: string;
            title: string;
        };
        author: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: MaterialType;
        description: string | null;
        title: string;
        isPublic: boolean;
        courseId: string;
        fileUrl: string | null;
        content: string | null;
        orderIndex: number;
        moduleId: string | null;
        authorId: string;
    };
}>;
export declare const deleteMaterialService: (caller: Caller, materialId: string) => Promise<void>;
export declare const completeMaterialService: (callerId: string, materialId: string) => Promise<{
    progressPercentage: number;
    isCompleted: boolean;
}>;
