import type { CreateCategoryInput, UpdateCategoryInput } from "./categories.validation";
/** Every Prisma call and rule for admin category management lives here. */
export declare const listCategoriesService: () => Promise<{
    categories: ({
        _count: {
            courses: number;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string;
        description: string | null;
    })[];
}>;
export declare const getCategoryByIdService: (id: string) => Promise<{
    category: {
        _count: {
            courses: number;
        };
        courses: ({
            _count: {
                enrollments: number;
            };
            creator: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            level: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            price: number;
            description: string;
            title: string;
            thumbnail: string | null;
            duration: number | null;
            status: import("../../../generated/prisma/enums").CourseStatus;
            isPublic: boolean;
            creatorId: string;
            tutorId: string | null;
            categoryId: string | null;
            tutorName: string | null;
            requirements: string[];
            prerequisites: string[];
            rejectionReason: string | null;
            rejectedAt: Date | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        description: string | null;
    };
}>;
export declare const createCategoryService: (input: CreateCategoryInput) => Promise<{
    category: {
        id: string;
        createdAt: Date;
        name: string;
        description: string | null;
    };
}>;
export declare const updateCategoryService: (id: string, input: UpdateCategoryInput) => Promise<{
    category: {
        id: string;
        createdAt: Date;
        name: string;
        description: string | null;
    };
}>;
export declare const deleteCategoryService: (id: string) => Promise<void>;
