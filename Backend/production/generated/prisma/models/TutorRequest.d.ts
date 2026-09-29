import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model TutorRequest
 *
 */
export type TutorRequestModel = runtime.Types.Result.DefaultSelection<Prisma.$TutorRequestPayload>;
export type AggregateTutorRequest = {
    _count: TutorRequestCountAggregateOutputType | null;
    _min: TutorRequestMinAggregateOutputType | null;
    _max: TutorRequestMaxAggregateOutputType | null;
};
export type TutorRequestMinAggregateOutputType = {
    id: string | null;
    email: string | null;
    password: string | null;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type TutorRequestMaxAggregateOutputType = {
    id: string | null;
    email: string | null;
    password: string | null;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type TutorRequestCountAggregateOutputType = {
    id: number;
    email: number;
    password: number;
    firstName: number;
    lastName: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type TutorRequestMinAggregateInputType = {
    id?: true;
    email?: true;
    password?: true;
    firstName?: true;
    lastName?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type TutorRequestMaxAggregateInputType = {
    id?: true;
    email?: true;
    password?: true;
    firstName?: true;
    lastName?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type TutorRequestCountAggregateInputType = {
    id?: true;
    email?: true;
    password?: true;
    firstName?: true;
    lastName?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type TutorRequestAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which TutorRequest to aggregate.
     */
    where?: Prisma.TutorRequestWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of TutorRequests to fetch.
     */
    orderBy?: Prisma.TutorRequestOrderByWithRelationInput | Prisma.TutorRequestOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.TutorRequestWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` TutorRequests from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` TutorRequests.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned TutorRequests
    **/
    _count?: true | TutorRequestCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: TutorRequestMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: TutorRequestMaxAggregateInputType;
};
export type GetTutorRequestAggregateType<T extends TutorRequestAggregateArgs> = {
    [P in keyof T & keyof AggregateTutorRequest]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateTutorRequest[P]> : Prisma.GetScalarType<T[P], AggregateTutorRequest[P]>;
};
export type TutorRequestGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TutorRequestWhereInput;
    orderBy?: Prisma.TutorRequestOrderByWithAggregationInput | Prisma.TutorRequestOrderByWithAggregationInput[];
    by: Prisma.TutorRequestScalarFieldEnum[] | Prisma.TutorRequestScalarFieldEnum;
    having?: Prisma.TutorRequestScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TutorRequestCountAggregateInputType | true;
    _min?: TutorRequestMinAggregateInputType;
    _max?: TutorRequestMaxAggregateInputType;
};
export type TutorRequestGroupByOutputType = {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    createdAt: Date;
    updatedAt: Date;
    _count: TutorRequestCountAggregateOutputType | null;
    _min: TutorRequestMinAggregateOutputType | null;
    _max: TutorRequestMaxAggregateOutputType | null;
};
export type GetTutorRequestGroupByPayload<T extends TutorRequestGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<TutorRequestGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof TutorRequestGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], TutorRequestGroupByOutputType[P]> : Prisma.GetScalarType<T[P], TutorRequestGroupByOutputType[P]>;
}>>;
export type TutorRequestWhereInput = {
    AND?: Prisma.TutorRequestWhereInput | Prisma.TutorRequestWhereInput[];
    OR?: Prisma.TutorRequestWhereInput[];
    NOT?: Prisma.TutorRequestWhereInput | Prisma.TutorRequestWhereInput[];
    id?: Prisma.StringFilter<"TutorRequest"> | string;
    email?: Prisma.StringFilter<"TutorRequest"> | string;
    password?: Prisma.StringFilter<"TutorRequest"> | string;
    firstName?: Prisma.StringFilter<"TutorRequest"> | string;
    lastName?: Prisma.StringFilter<"TutorRequest"> | string;
    createdAt?: Prisma.DateTimeFilter<"TutorRequest"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"TutorRequest"> | Date | string;
};
export type TutorRequestOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    firstName?: Prisma.SortOrder;
    lastName?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TutorRequestWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    email?: string;
    AND?: Prisma.TutorRequestWhereInput | Prisma.TutorRequestWhereInput[];
    OR?: Prisma.TutorRequestWhereInput[];
    NOT?: Prisma.TutorRequestWhereInput | Prisma.TutorRequestWhereInput[];
    password?: Prisma.StringFilter<"TutorRequest"> | string;
    firstName?: Prisma.StringFilter<"TutorRequest"> | string;
    lastName?: Prisma.StringFilter<"TutorRequest"> | string;
    createdAt?: Prisma.DateTimeFilter<"TutorRequest"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"TutorRequest"> | Date | string;
}, "id" | "email">;
export type TutorRequestOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    firstName?: Prisma.SortOrder;
    lastName?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.TutorRequestCountOrderByAggregateInput;
    _max?: Prisma.TutorRequestMaxOrderByAggregateInput;
    _min?: Prisma.TutorRequestMinOrderByAggregateInput;
};
export type TutorRequestScalarWhereWithAggregatesInput = {
    AND?: Prisma.TutorRequestScalarWhereWithAggregatesInput | Prisma.TutorRequestScalarWhereWithAggregatesInput[];
    OR?: Prisma.TutorRequestScalarWhereWithAggregatesInput[];
    NOT?: Prisma.TutorRequestScalarWhereWithAggregatesInput | Prisma.TutorRequestScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"TutorRequest"> | string;
    email?: Prisma.StringWithAggregatesFilter<"TutorRequest"> | string;
    password?: Prisma.StringWithAggregatesFilter<"TutorRequest"> | string;
    firstName?: Prisma.StringWithAggregatesFilter<"TutorRequest"> | string;
    lastName?: Prisma.StringWithAggregatesFilter<"TutorRequest"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"TutorRequest"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"TutorRequest"> | Date | string;
};
export type TutorRequestCreateInput = {
    id?: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TutorRequestUncheckedCreateInput = {
    id?: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TutorRequestUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    firstName?: Prisma.StringFieldUpdateOperationsInput | string;
    lastName?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TutorRequestUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    firstName?: Prisma.StringFieldUpdateOperationsInput | string;
    lastName?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TutorRequestCreateManyInput = {
    id?: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TutorRequestUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    firstName?: Prisma.StringFieldUpdateOperationsInput | string;
    lastName?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TutorRequestUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    firstName?: Prisma.StringFieldUpdateOperationsInput | string;
    lastName?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TutorRequestCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    firstName?: Prisma.SortOrder;
    lastName?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TutorRequestMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    firstName?: Prisma.SortOrder;
    lastName?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TutorRequestMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    firstName?: Prisma.SortOrder;
    lastName?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TutorRequestSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    email?: boolean;
    password?: boolean;
    firstName?: boolean;
    lastName?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["tutorRequest"]>;
export type TutorRequestSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    email?: boolean;
    password?: boolean;
    firstName?: boolean;
    lastName?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["tutorRequest"]>;
export type TutorRequestSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    email?: boolean;
    password?: boolean;
    firstName?: boolean;
    lastName?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["tutorRequest"]>;
export type TutorRequestSelectScalar = {
    id?: boolean;
    email?: boolean;
    password?: boolean;
    firstName?: boolean;
    lastName?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type TutorRequestOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "email" | "password" | "firstName" | "lastName" | "createdAt" | "updatedAt", ExtArgs["result"]["tutorRequest"]>;
export type $TutorRequestPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "TutorRequest";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["tutorRequest"]>;
    composites: {};
};
export type TutorRequestGetPayload<S extends boolean | null | undefined | TutorRequestDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$TutorRequestPayload, S>;
export type TutorRequestCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<TutorRequestFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: TutorRequestCountAggregateInputType | true;
};
export interface TutorRequestDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['TutorRequest'];
        meta: {
            name: 'TutorRequest';
        };
    };
    /**
     * Find zero or one TutorRequest that matches the filter.
     * @param {TutorRequestFindUniqueArgs} args - Arguments to find a TutorRequest
     * @example
     * // Get one TutorRequest
     * const tutorRequest = await prisma.tutorRequest.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TutorRequestFindUniqueArgs>(args: Prisma.SelectSubset<T, TutorRequestFindUniqueArgs<ExtArgs>>): Prisma.Prisma__TutorRequestClient<runtime.Types.Result.GetResult<Prisma.$TutorRequestPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one TutorRequest that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TutorRequestFindUniqueOrThrowArgs} args - Arguments to find a TutorRequest
     * @example
     * // Get one TutorRequest
     * const tutorRequest = await prisma.tutorRequest.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TutorRequestFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, TutorRequestFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__TutorRequestClient<runtime.Types.Result.GetResult<Prisma.$TutorRequestPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first TutorRequest that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TutorRequestFindFirstArgs} args - Arguments to find a TutorRequest
     * @example
     * // Get one TutorRequest
     * const tutorRequest = await prisma.tutorRequest.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TutorRequestFindFirstArgs>(args?: Prisma.SelectSubset<T, TutorRequestFindFirstArgs<ExtArgs>>): Prisma.Prisma__TutorRequestClient<runtime.Types.Result.GetResult<Prisma.$TutorRequestPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first TutorRequest that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TutorRequestFindFirstOrThrowArgs} args - Arguments to find a TutorRequest
     * @example
     * // Get one TutorRequest
     * const tutorRequest = await prisma.tutorRequest.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TutorRequestFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, TutorRequestFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__TutorRequestClient<runtime.Types.Result.GetResult<Prisma.$TutorRequestPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more TutorRequests that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TutorRequestFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TutorRequests
     * const tutorRequests = await prisma.tutorRequest.findMany()
     *
     * // Get first 10 TutorRequests
     * const tutorRequests = await prisma.tutorRequest.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const tutorRequestWithIdOnly = await prisma.tutorRequest.findMany({ select: { id: true } })
     *
     */
    findMany<T extends TutorRequestFindManyArgs>(args?: Prisma.SelectSubset<T, TutorRequestFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TutorRequestPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a TutorRequest.
     * @param {TutorRequestCreateArgs} args - Arguments to create a TutorRequest.
     * @example
     * // Create one TutorRequest
     * const TutorRequest = await prisma.tutorRequest.create({
     *   data: {
     *     // ... data to create a TutorRequest
     *   }
     * })
     *
     */
    create<T extends TutorRequestCreateArgs>(args: Prisma.SelectSubset<T, TutorRequestCreateArgs<ExtArgs>>): Prisma.Prisma__TutorRequestClient<runtime.Types.Result.GetResult<Prisma.$TutorRequestPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many TutorRequests.
     * @param {TutorRequestCreateManyArgs} args - Arguments to create many TutorRequests.
     * @example
     * // Create many TutorRequests
     * const tutorRequest = await prisma.tutorRequest.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends TutorRequestCreateManyArgs>(args?: Prisma.SelectSubset<T, TutorRequestCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many TutorRequests and returns the data saved in the database.
     * @param {TutorRequestCreateManyAndReturnArgs} args - Arguments to create many TutorRequests.
     * @example
     * // Create many TutorRequests
     * const tutorRequest = await prisma.tutorRequest.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many TutorRequests and only return the `id`
     * const tutorRequestWithIdOnly = await prisma.tutorRequest.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends TutorRequestCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, TutorRequestCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TutorRequestPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a TutorRequest.
     * @param {TutorRequestDeleteArgs} args - Arguments to delete one TutorRequest.
     * @example
     * // Delete one TutorRequest
     * const TutorRequest = await prisma.tutorRequest.delete({
     *   where: {
     *     // ... filter to delete one TutorRequest
     *   }
     * })
     *
     */
    delete<T extends TutorRequestDeleteArgs>(args: Prisma.SelectSubset<T, TutorRequestDeleteArgs<ExtArgs>>): Prisma.Prisma__TutorRequestClient<runtime.Types.Result.GetResult<Prisma.$TutorRequestPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one TutorRequest.
     * @param {TutorRequestUpdateArgs} args - Arguments to update one TutorRequest.
     * @example
     * // Update one TutorRequest
     * const tutorRequest = await prisma.tutorRequest.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends TutorRequestUpdateArgs>(args: Prisma.SelectSubset<T, TutorRequestUpdateArgs<ExtArgs>>): Prisma.Prisma__TutorRequestClient<runtime.Types.Result.GetResult<Prisma.$TutorRequestPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more TutorRequests.
     * @param {TutorRequestDeleteManyArgs} args - Arguments to filter TutorRequests to delete.
     * @example
     * // Delete a few TutorRequests
     * const { count } = await prisma.tutorRequest.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends TutorRequestDeleteManyArgs>(args?: Prisma.SelectSubset<T, TutorRequestDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more TutorRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TutorRequestUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TutorRequests
     * const tutorRequest = await prisma.tutorRequest.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends TutorRequestUpdateManyArgs>(args: Prisma.SelectSubset<T, TutorRequestUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more TutorRequests and returns the data updated in the database.
     * @param {TutorRequestUpdateManyAndReturnArgs} args - Arguments to update many TutorRequests.
     * @example
     * // Update many TutorRequests
     * const tutorRequest = await prisma.tutorRequest.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more TutorRequests and only return the `id`
     * const tutorRequestWithIdOnly = await prisma.tutorRequest.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends TutorRequestUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, TutorRequestUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TutorRequestPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one TutorRequest.
     * @param {TutorRequestUpsertArgs} args - Arguments to update or create a TutorRequest.
     * @example
     * // Update or create a TutorRequest
     * const tutorRequest = await prisma.tutorRequest.upsert({
     *   create: {
     *     // ... data to create a TutorRequest
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TutorRequest we want to update
     *   }
     * })
     */
    upsert<T extends TutorRequestUpsertArgs>(args: Prisma.SelectSubset<T, TutorRequestUpsertArgs<ExtArgs>>): Prisma.Prisma__TutorRequestClient<runtime.Types.Result.GetResult<Prisma.$TutorRequestPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of TutorRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TutorRequestCountArgs} args - Arguments to filter TutorRequests to count.
     * @example
     * // Count the number of TutorRequests
     * const count = await prisma.tutorRequest.count({
     *   where: {
     *     // ... the filter for the TutorRequests we want to count
     *   }
     * })
    **/
    count<T extends TutorRequestCountArgs>(args?: Prisma.Subset<T, TutorRequestCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], TutorRequestCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a TutorRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TutorRequestAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TutorRequestAggregateArgs>(args: Prisma.Subset<T, TutorRequestAggregateArgs>): Prisma.PrismaPromise<GetTutorRequestAggregateType<T>>;
    /**
     * Group by TutorRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TutorRequestGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<T extends TutorRequestGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: TutorRequestGroupByArgs['orderBy'];
    } : {
        orderBy?: TutorRequestGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, TutorRequestGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTutorRequestGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the TutorRequest model
     */
    readonly fields: TutorRequestFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for TutorRequest.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__TutorRequestClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
/**
 * Fields of the TutorRequest model
 */
export interface TutorRequestFieldRefs {
    readonly id: Prisma.FieldRef<"TutorRequest", 'String'>;
    readonly email: Prisma.FieldRef<"TutorRequest", 'String'>;
    readonly password: Prisma.FieldRef<"TutorRequest", 'String'>;
    readonly firstName: Prisma.FieldRef<"TutorRequest", 'String'>;
    readonly lastName: Prisma.FieldRef<"TutorRequest", 'String'>;
    readonly createdAt: Prisma.FieldRef<"TutorRequest", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"TutorRequest", 'DateTime'>;
}
/**
 * TutorRequest findUnique
 */
export type TutorRequestFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TutorRequest
     */
    select?: Prisma.TutorRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TutorRequest
     */
    omit?: Prisma.TutorRequestOmit<ExtArgs> | null;
    /**
     * Filter, which TutorRequest to fetch.
     */
    where: Prisma.TutorRequestWhereUniqueInput;
};
/**
 * TutorRequest findUniqueOrThrow
 */
export type TutorRequestFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TutorRequest
     */
    select?: Prisma.TutorRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TutorRequest
     */
    omit?: Prisma.TutorRequestOmit<ExtArgs> | null;
    /**
     * Filter, which TutorRequest to fetch.
     */
    where: Prisma.TutorRequestWhereUniqueInput;
};
/**
 * TutorRequest findFirst
 */
export type TutorRequestFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TutorRequest
     */
    select?: Prisma.TutorRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TutorRequest
     */
    omit?: Prisma.TutorRequestOmit<ExtArgs> | null;
    /**
     * Filter, which TutorRequest to fetch.
     */
    where?: Prisma.TutorRequestWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of TutorRequests to fetch.
     */
    orderBy?: Prisma.TutorRequestOrderByWithRelationInput | Prisma.TutorRequestOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for TutorRequests.
     */
    cursor?: Prisma.TutorRequestWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` TutorRequests from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` TutorRequests.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of TutorRequests.
     */
    distinct?: Prisma.TutorRequestScalarFieldEnum | Prisma.TutorRequestScalarFieldEnum[];
};
/**
 * TutorRequest findFirstOrThrow
 */
export type TutorRequestFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TutorRequest
     */
    select?: Prisma.TutorRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TutorRequest
     */
    omit?: Prisma.TutorRequestOmit<ExtArgs> | null;
    /**
     * Filter, which TutorRequest to fetch.
     */
    where?: Prisma.TutorRequestWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of TutorRequests to fetch.
     */
    orderBy?: Prisma.TutorRequestOrderByWithRelationInput | Prisma.TutorRequestOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for TutorRequests.
     */
    cursor?: Prisma.TutorRequestWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` TutorRequests from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` TutorRequests.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of TutorRequests.
     */
    distinct?: Prisma.TutorRequestScalarFieldEnum | Prisma.TutorRequestScalarFieldEnum[];
};
/**
 * TutorRequest findMany
 */
export type TutorRequestFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TutorRequest
     */
    select?: Prisma.TutorRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TutorRequest
     */
    omit?: Prisma.TutorRequestOmit<ExtArgs> | null;
    /**
     * Filter, which TutorRequests to fetch.
     */
    where?: Prisma.TutorRequestWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of TutorRequests to fetch.
     */
    orderBy?: Prisma.TutorRequestOrderByWithRelationInput | Prisma.TutorRequestOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing TutorRequests.
     */
    cursor?: Prisma.TutorRequestWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` TutorRequests from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` TutorRequests.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of TutorRequests.
     */
    distinct?: Prisma.TutorRequestScalarFieldEnum | Prisma.TutorRequestScalarFieldEnum[];
};
/**
 * TutorRequest create
 */
export type TutorRequestCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TutorRequest
     */
    select?: Prisma.TutorRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TutorRequest
     */
    omit?: Prisma.TutorRequestOmit<ExtArgs> | null;
    /**
     * The data needed to create a TutorRequest.
     */
    data: Prisma.XOR<Prisma.TutorRequestCreateInput, Prisma.TutorRequestUncheckedCreateInput>;
};
/**
 * TutorRequest createMany
 */
export type TutorRequestCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many TutorRequests.
     */
    data: Prisma.TutorRequestCreateManyInput | Prisma.TutorRequestCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * TutorRequest createManyAndReturn
 */
export type TutorRequestCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TutorRequest
     */
    select?: Prisma.TutorRequestSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the TutorRequest
     */
    omit?: Prisma.TutorRequestOmit<ExtArgs> | null;
    /**
     * The data used to create many TutorRequests.
     */
    data: Prisma.TutorRequestCreateManyInput | Prisma.TutorRequestCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * TutorRequest update
 */
export type TutorRequestUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TutorRequest
     */
    select?: Prisma.TutorRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TutorRequest
     */
    omit?: Prisma.TutorRequestOmit<ExtArgs> | null;
    /**
     * The data needed to update a TutorRequest.
     */
    data: Prisma.XOR<Prisma.TutorRequestUpdateInput, Prisma.TutorRequestUncheckedUpdateInput>;
    /**
     * Choose, which TutorRequest to update.
     */
    where: Prisma.TutorRequestWhereUniqueInput;
};
/**
 * TutorRequest updateMany
 */
export type TutorRequestUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update TutorRequests.
     */
    data: Prisma.XOR<Prisma.TutorRequestUpdateManyMutationInput, Prisma.TutorRequestUncheckedUpdateManyInput>;
    /**
     * Filter which TutorRequests to update
     */
    where?: Prisma.TutorRequestWhereInput;
    /**
     * Limit how many TutorRequests to update.
     */
    limit?: number;
};
/**
 * TutorRequest updateManyAndReturn
 */
export type TutorRequestUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TutorRequest
     */
    select?: Prisma.TutorRequestSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the TutorRequest
     */
    omit?: Prisma.TutorRequestOmit<ExtArgs> | null;
    /**
     * The data used to update TutorRequests.
     */
    data: Prisma.XOR<Prisma.TutorRequestUpdateManyMutationInput, Prisma.TutorRequestUncheckedUpdateManyInput>;
    /**
     * Filter which TutorRequests to update
     */
    where?: Prisma.TutorRequestWhereInput;
    /**
     * Limit how many TutorRequests to update.
     */
    limit?: number;
};
/**
 * TutorRequest upsert
 */
export type TutorRequestUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TutorRequest
     */
    select?: Prisma.TutorRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TutorRequest
     */
    omit?: Prisma.TutorRequestOmit<ExtArgs> | null;
    /**
     * The filter to search for the TutorRequest to update in case it exists.
     */
    where: Prisma.TutorRequestWhereUniqueInput;
    /**
     * In case the TutorRequest found by the `where` argument doesn't exist, create a new TutorRequest with this data.
     */
    create: Prisma.XOR<Prisma.TutorRequestCreateInput, Prisma.TutorRequestUncheckedCreateInput>;
    /**
     * In case the TutorRequest was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.TutorRequestUpdateInput, Prisma.TutorRequestUncheckedUpdateInput>;
};
/**
 * TutorRequest delete
 */
export type TutorRequestDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TutorRequest
     */
    select?: Prisma.TutorRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TutorRequest
     */
    omit?: Prisma.TutorRequestOmit<ExtArgs> | null;
    /**
     * Filter which TutorRequest to delete.
     */
    where: Prisma.TutorRequestWhereUniqueInput;
};
/**
 * TutorRequest deleteMany
 */
export type TutorRequestDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which TutorRequests to delete
     */
    where?: Prisma.TutorRequestWhereInput;
    /**
     * Limit how many TutorRequests to delete.
     */
    limit?: number;
};
/**
 * TutorRequest without action
 */
export type TutorRequestDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TutorRequest
     */
    select?: Prisma.TutorRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TutorRequest
     */
    omit?: Prisma.TutorRequestOmit<ExtArgs> | null;
};
