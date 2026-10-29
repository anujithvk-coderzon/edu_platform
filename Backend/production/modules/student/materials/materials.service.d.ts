export declare const getMaterialByIdService: (studentId: string, materialId: string) => Promise<{
    material: {
        id: string;
        type: import("../../../generated/prisma/enums").MaterialType;
        description: string;
        title: string;
        course: {
            id: string;
            title: string;
        };
        courseId: string;
        orderIndex: number;
        fileUrl: string;
        content: string;
        moduleId: string;
    };
}>;
export declare const completeMaterialService: (studentId: string, materialId: string) => Promise<{
    progressPercentage: number;
    isCompleted: boolean;
    totalItems: number;
    completedItems: number;
}>;
