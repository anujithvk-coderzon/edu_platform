export declare const getMaterialByIdService: (studentId: string, materialId: string) => Promise<{
    material: {
        course: {
            id: string;
            title: string;
            creatorId: string;
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
    };
}>;
export declare const completeMaterialService: (studentId: string, materialId: string) => Promise<{
    progressPercentage: number;
    isCompleted: boolean;
    totalItems: number;
    completedItems: number;
}>;
