export declare const uploadAvatarService: (studentId: string, file: Express.Multer.File) => Promise<{
    url: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatar: string;
        updatedAt: Date;
    };
}>;
