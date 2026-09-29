import type { TutorRequestQuery } from "./tutorRequests.validation";
export declare const getPendingTutorRequestsCountService: (role: string | undefined) => Promise<{
    count: number;
}>;
export declare const getAllTutorRequestsService: (role: string | undefined, _query: TutorRequestQuery) => Promise<{
    requests: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        createdAt: Date;
        updatedAt: Date;
    }[];
}>;
/**
 * Creates the tutor account from the request and removes the request in one
 * transaction, so a failed delete cannot leave a duplicate account behind.
 */
export declare const acceptTutorRequestService: (role: string | undefined, requestId: string) => Promise<{
    tutor: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
    };
}>;
/** Emails the applicant first, then removes the request. */
export declare const rejectTutorRequestService: (role: string | undefined, requestId: string) => Promise<void>;
