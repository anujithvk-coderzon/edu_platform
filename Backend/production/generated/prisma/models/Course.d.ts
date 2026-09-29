import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model Course
 *
 */
export type CourseModel = runtime.Types.Result.DefaultSelection<Prisma.$CoursePayload>;
export type AggregateCourse = {
    _count: CourseCountAggregateOutputType | null;
    _avg: CourseAvgAggregateOutputType | null;
    _sum: CourseSumAggregateOutputType | null;
    _min: CourseMinAggregateOutputType | null;
    _max: CourseMaxAggregateOutputType | null;
};
export type CourseAvgAggregateOutputType = {
    price: number | null;
    duration: number | null;
};
export type CourseSumAggregateOutputType = {
    price: number | null;
    duration: number | null;
};
export type CourseMinAggregateOutputType = {
    id: string | null;
    title: string | null;
    description: string | null;
    thumbnail: string | null;
    price: number | null;
    duration: number | null;
    level: string | null;
    status: $Enums.CourseStatus | null;
    isPublic: boolean | null;
    creatorId: string | null;
    tutorId: string | null;
    categoryId: string | null;
    tutorName: string | null;
    rejectionReason: string | null;
    rejectedAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type CourseMaxAggregateOutputType = {
    id: string | null;
    title: string | null;
    description: string | null;
    thumbnail: string | null;
    price: number | null;
    duration: number | null;
    level: string | null;
    status: $Enums.CourseStatus | null;
    isPublic: boolean | null;
    creatorId: string | null;
    tutorId: string | null;
    categoryId: string | null;
    tutorName: string | null;
    rejectionReason: string | null;
    rejectedAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type CourseCountAggregateOutputType = {
    id: number;
    title: number;
    description: number;
    thumbnail: number;
    price: number;
    duration: number;
    level: number;
    status: number;
    isPublic: number;
    creatorId: number;
    tutorId: number;
    categoryId: number;
    tutorName: number;
    requirements: number;
    prerequisites: number;
    rejectionReason: number;
    rejectedAt: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type CourseAvgAggregateInputType = {
    price?: true;
    duration?: true;
};
export type CourseSumAggregateInputType = {
    price?: true;
    duration?: true;
};
export type CourseMinAggregateInputType = {
    id?: true;
    title?: true;
    description?: true;
    thumbnail?: true;
    price?: true;
    duration?: true;
    level?: true;
    status?: true;
    isPublic?: true;
    creatorId?: true;
    tutorId?: true;
    categoryId?: true;
    tutorName?: true;
    rejectionReason?: true;
    rejectedAt?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type CourseMaxAggregateInputType = {
    id?: true;
    title?: true;
    description?: true;
    thumbnail?: true;
    price?: true;
    duration?: true;
    level?: true;
    status?: true;
    isPublic?: true;
    creatorId?: true;
    tutorId?: true;
    categoryId?: true;
    tutorName?: true;
    rejectionReason?: true;
    rejectedAt?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type CourseCountAggregateInputType = {
    id?: true;
    title?: true;
    description?: true;
    thumbnail?: true;
    price?: true;
    duration?: true;
    level?: true;
    status?: true;
    isPublic?: true;
    creatorId?: true;
    tutorId?: true;
    categoryId?: true;
    tutorName?: true;
    requirements?: true;
    prerequisites?: true;
    rejectionReason?: true;
    rejectedAt?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type CourseAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Course to aggregate.
     */
    where?: Prisma.CourseWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Courses to fetch.
     */
    orderBy?: Prisma.CourseOrderByWithRelationInput | Prisma.CourseOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.CourseWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Courses from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Courses.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Courses
    **/
    _count?: true | CourseCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: CourseAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: CourseSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: CourseMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: CourseMaxAggregateInputType;
};
export type GetCourseAggregateType<T extends CourseAggregateArgs> = {
    [P in keyof T & keyof AggregateCourse]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateCourse[P]> : Prisma.GetScalarType<T[P], AggregateCourse[P]>;
};
export type CourseGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CourseWhereInput;
    orderBy?: Prisma.CourseOrderByWithAggregationInput | Prisma.CourseOrderByWithAggregationInput[];
    by: Prisma.CourseScalarFieldEnum[] | Prisma.CourseScalarFieldEnum;
    having?: Prisma.CourseScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: CourseCountAggregateInputType | true;
    _avg?: CourseAvgAggregateInputType;
    _sum?: CourseSumAggregateInputType;
    _min?: CourseMinAggregateInputType;
    _max?: CourseMaxAggregateInputType;
};
export type CourseGroupByOutputType = {
    id: string;
    title: string;
    description: string;
    thumbnail: string | null;
    price: number;
    duration: number | null;
    level: string | null;
    status: $Enums.CourseStatus;
    isPublic: boolean;
    creatorId: string;
    tutorId: string | null;
    categoryId: string | null;
    tutorName: string | null;
    requirements: string[];
    prerequisites: string[];
    rejectionReason: string | null;
    rejectedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    _count: CourseCountAggregateOutputType | null;
    _avg: CourseAvgAggregateOutputType | null;
    _sum: CourseSumAggregateOutputType | null;
    _min: CourseMinAggregateOutputType | null;
    _max: CourseMaxAggregateOutputType | null;
};
export type GetCourseGroupByPayload<T extends CourseGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<CourseGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof CourseGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], CourseGroupByOutputType[P]> : Prisma.GetScalarType<T[P], CourseGroupByOutputType[P]>;
}>>;
export type CourseWhereInput = {
    AND?: Prisma.CourseWhereInput | Prisma.CourseWhereInput[];
    OR?: Prisma.CourseWhereInput[];
    NOT?: Prisma.CourseWhereInput | Prisma.CourseWhereInput[];
    id?: Prisma.StringFilter<"Course"> | string;
    title?: Prisma.StringFilter<"Course"> | string;
    description?: Prisma.StringFilter<"Course"> | string;
    thumbnail?: Prisma.StringNullableFilter<"Course"> | string | null;
    price?: Prisma.FloatFilter<"Course"> | number;
    duration?: Prisma.IntNullableFilter<"Course"> | number | null;
    level?: Prisma.StringNullableFilter<"Course"> | string | null;
    status?: Prisma.EnumCourseStatusFilter<"Course"> | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFilter<"Course"> | boolean;
    creatorId?: Prisma.StringFilter<"Course"> | string;
    tutorId?: Prisma.StringNullableFilter<"Course"> | string | null;
    categoryId?: Prisma.StringNullableFilter<"Course"> | string | null;
    tutorName?: Prisma.StringNullableFilter<"Course"> | string | null;
    requirements?: Prisma.StringNullableListFilter<"Course">;
    prerequisites?: Prisma.StringNullableListFilter<"Course">;
    rejectionReason?: Prisma.StringNullableFilter<"Course"> | string | null;
    rejectedAt?: Prisma.DateTimeNullableFilter<"Course"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"Course"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Course"> | Date | string;
    creator?: Prisma.XOR<Prisma.AdminScalarRelationFilter, Prisma.AdminWhereInput>;
    tutor?: Prisma.XOR<Prisma.AdminNullableScalarRelationFilter, Prisma.AdminWhereInput> | null;
    category?: Prisma.XOR<Prisma.CategoryNullableScalarRelationFilter, Prisma.CategoryWhereInput> | null;
    enrollments?: Prisma.EnrollmentListRelationFilter;
    modules?: Prisma.CourseModuleListRelationFilter;
    materials?: Prisma.MaterialListRelationFilter;
    assignments?: Prisma.AssignmentListRelationFilter;
    reviews?: Prisma.ReviewListRelationFilter;
};
export type CourseOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    thumbnail?: Prisma.SortOrderInput | Prisma.SortOrder;
    price?: Prisma.SortOrder;
    duration?: Prisma.SortOrderInput | Prisma.SortOrder;
    level?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isPublic?: Prisma.SortOrder;
    creatorId?: Prisma.SortOrder;
    tutorId?: Prisma.SortOrderInput | Prisma.SortOrder;
    categoryId?: Prisma.SortOrderInput | Prisma.SortOrder;
    tutorName?: Prisma.SortOrderInput | Prisma.SortOrder;
    requirements?: Prisma.SortOrder;
    prerequisites?: Prisma.SortOrder;
    rejectionReason?: Prisma.SortOrderInput | Prisma.SortOrder;
    rejectedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    creator?: Prisma.AdminOrderByWithRelationInput;
    tutor?: Prisma.AdminOrderByWithRelationInput;
    category?: Prisma.CategoryOrderByWithRelationInput;
    enrollments?: Prisma.EnrollmentOrderByRelationAggregateInput;
    modules?: Prisma.CourseModuleOrderByRelationAggregateInput;
    materials?: Prisma.MaterialOrderByRelationAggregateInput;
    assignments?: Prisma.AssignmentOrderByRelationAggregateInput;
    reviews?: Prisma.ReviewOrderByRelationAggregateInput;
};
export type CourseWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.CourseWhereInput | Prisma.CourseWhereInput[];
    OR?: Prisma.CourseWhereInput[];
    NOT?: Prisma.CourseWhereInput | Prisma.CourseWhereInput[];
    title?: Prisma.StringFilter<"Course"> | string;
    description?: Prisma.StringFilter<"Course"> | string;
    thumbnail?: Prisma.StringNullableFilter<"Course"> | string | null;
    price?: Prisma.FloatFilter<"Course"> | number;
    duration?: Prisma.IntNullableFilter<"Course"> | number | null;
    level?: Prisma.StringNullableFilter<"Course"> | string | null;
    status?: Prisma.EnumCourseStatusFilter<"Course"> | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFilter<"Course"> | boolean;
    creatorId?: Prisma.StringFilter<"Course"> | string;
    tutorId?: Prisma.StringNullableFilter<"Course"> | string | null;
    categoryId?: Prisma.StringNullableFilter<"Course"> | string | null;
    tutorName?: Prisma.StringNullableFilter<"Course"> | string | null;
    requirements?: Prisma.StringNullableListFilter<"Course">;
    prerequisites?: Prisma.StringNullableListFilter<"Course">;
    rejectionReason?: Prisma.StringNullableFilter<"Course"> | string | null;
    rejectedAt?: Prisma.DateTimeNullableFilter<"Course"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"Course"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Course"> | Date | string;
    creator?: Prisma.XOR<Prisma.AdminScalarRelationFilter, Prisma.AdminWhereInput>;
    tutor?: Prisma.XOR<Prisma.AdminNullableScalarRelationFilter, Prisma.AdminWhereInput> | null;
    category?: Prisma.XOR<Prisma.CategoryNullableScalarRelationFilter, Prisma.CategoryWhereInput> | null;
    enrollments?: Prisma.EnrollmentListRelationFilter;
    modules?: Prisma.CourseModuleListRelationFilter;
    materials?: Prisma.MaterialListRelationFilter;
    assignments?: Prisma.AssignmentListRelationFilter;
    reviews?: Prisma.ReviewListRelationFilter;
}, "id">;
export type CourseOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    thumbnail?: Prisma.SortOrderInput | Prisma.SortOrder;
    price?: Prisma.SortOrder;
    duration?: Prisma.SortOrderInput | Prisma.SortOrder;
    level?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isPublic?: Prisma.SortOrder;
    creatorId?: Prisma.SortOrder;
    tutorId?: Prisma.SortOrderInput | Prisma.SortOrder;
    categoryId?: Prisma.SortOrderInput | Prisma.SortOrder;
    tutorName?: Prisma.SortOrderInput | Prisma.SortOrder;
    requirements?: Prisma.SortOrder;
    prerequisites?: Prisma.SortOrder;
    rejectionReason?: Prisma.SortOrderInput | Prisma.SortOrder;
    rejectedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.CourseCountOrderByAggregateInput;
    _avg?: Prisma.CourseAvgOrderByAggregateInput;
    _max?: Prisma.CourseMaxOrderByAggregateInput;
    _min?: Prisma.CourseMinOrderByAggregateInput;
    _sum?: Prisma.CourseSumOrderByAggregateInput;
};
export type CourseScalarWhereWithAggregatesInput = {
    AND?: Prisma.CourseScalarWhereWithAggregatesInput | Prisma.CourseScalarWhereWithAggregatesInput[];
    OR?: Prisma.CourseScalarWhereWithAggregatesInput[];
    NOT?: Prisma.CourseScalarWhereWithAggregatesInput | Prisma.CourseScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Course"> | string;
    title?: Prisma.StringWithAggregatesFilter<"Course"> | string;
    description?: Prisma.StringWithAggregatesFilter<"Course"> | string;
    thumbnail?: Prisma.StringNullableWithAggregatesFilter<"Course"> | string | null;
    price?: Prisma.FloatWithAggregatesFilter<"Course"> | number;
    duration?: Prisma.IntNullableWithAggregatesFilter<"Course"> | number | null;
    level?: Prisma.StringNullableWithAggregatesFilter<"Course"> | string | null;
    status?: Prisma.EnumCourseStatusWithAggregatesFilter<"Course"> | $Enums.CourseStatus;
    isPublic?: Prisma.BoolWithAggregatesFilter<"Course"> | boolean;
    creatorId?: Prisma.StringWithAggregatesFilter<"Course"> | string;
    tutorId?: Prisma.StringNullableWithAggregatesFilter<"Course"> | string | null;
    categoryId?: Prisma.StringNullableWithAggregatesFilter<"Course"> | string | null;
    tutorName?: Prisma.StringNullableWithAggregatesFilter<"Course"> | string | null;
    requirements?: Prisma.StringNullableListFilter<"Course">;
    prerequisites?: Prisma.StringNullableListFilter<"Course">;
    rejectionReason?: Prisma.StringNullableWithAggregatesFilter<"Course"> | string | null;
    rejectedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"Course"> | Date | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Course"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Course"> | Date | string;
};
export type CourseCreateInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    creator: Prisma.AdminCreateNestedOneWithoutCreatedCoursesInput;
    tutor?: Prisma.AdminCreateNestedOneWithoutAssignedCoursesInput;
    category?: Prisma.CategoryCreateNestedOneWithoutCoursesInput;
    enrollments?: Prisma.EnrollmentCreateNestedManyWithoutCourseInput;
    modules?: Prisma.CourseModuleCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewCreateNestedManyWithoutCourseInput;
};
export type CourseUncheckedCreateInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    creatorId: string;
    tutorId?: string | null;
    categoryId?: string | null;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    enrollments?: Prisma.EnrollmentUncheckedCreateNestedManyWithoutCourseInput;
    modules?: Prisma.CourseModuleUncheckedCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialUncheckedCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentUncheckedCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewUncheckedCreateNestedManyWithoutCourseInput;
};
export type CourseUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    creator?: Prisma.AdminUpdateOneRequiredWithoutCreatedCoursesNestedInput;
    tutor?: Prisma.AdminUpdateOneWithoutAssignedCoursesNestedInput;
    category?: Prisma.CategoryUpdateOneWithoutCoursesNestedInput;
    enrollments?: Prisma.EnrollmentUpdateManyWithoutCourseNestedInput;
    modules?: Prisma.CourseModuleUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUpdateManyWithoutCourseNestedInput;
};
export type CourseUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    creatorId?: Prisma.StringFieldUpdateOperationsInput | string;
    tutorId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    enrollments?: Prisma.EnrollmentUncheckedUpdateManyWithoutCourseNestedInput;
    modules?: Prisma.CourseModuleUncheckedUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUncheckedUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUncheckedUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUncheckedUpdateManyWithoutCourseNestedInput;
};
export type CourseCreateManyInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    creatorId: string;
    tutorId?: string | null;
    categoryId?: string | null;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type CourseUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CourseUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    creatorId?: Prisma.StringFieldUpdateOperationsInput | string;
    tutorId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CourseListRelationFilter = {
    every?: Prisma.CourseWhereInput;
    some?: Prisma.CourseWhereInput;
    none?: Prisma.CourseWhereInput;
};
export type CourseOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    has?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    hasEvery?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    hasSome?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    isEmpty?: boolean;
};
export type CourseCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    thumbnail?: Prisma.SortOrder;
    price?: Prisma.SortOrder;
    duration?: Prisma.SortOrder;
    level?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isPublic?: Prisma.SortOrder;
    creatorId?: Prisma.SortOrder;
    tutorId?: Prisma.SortOrder;
    categoryId?: Prisma.SortOrder;
    tutorName?: Prisma.SortOrder;
    requirements?: Prisma.SortOrder;
    prerequisites?: Prisma.SortOrder;
    rejectionReason?: Prisma.SortOrder;
    rejectedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type CourseAvgOrderByAggregateInput = {
    price?: Prisma.SortOrder;
    duration?: Prisma.SortOrder;
};
export type CourseMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    thumbnail?: Prisma.SortOrder;
    price?: Prisma.SortOrder;
    duration?: Prisma.SortOrder;
    level?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isPublic?: Prisma.SortOrder;
    creatorId?: Prisma.SortOrder;
    tutorId?: Prisma.SortOrder;
    categoryId?: Prisma.SortOrder;
    tutorName?: Prisma.SortOrder;
    rejectionReason?: Prisma.SortOrder;
    rejectedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type CourseMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    thumbnail?: Prisma.SortOrder;
    price?: Prisma.SortOrder;
    duration?: Prisma.SortOrder;
    level?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isPublic?: Prisma.SortOrder;
    creatorId?: Prisma.SortOrder;
    tutorId?: Prisma.SortOrder;
    categoryId?: Prisma.SortOrder;
    tutorName?: Prisma.SortOrder;
    rejectionReason?: Prisma.SortOrder;
    rejectedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type CourseSumOrderByAggregateInput = {
    price?: Prisma.SortOrder;
    duration?: Prisma.SortOrder;
};
export type CourseScalarRelationFilter = {
    is?: Prisma.CourseWhereInput;
    isNot?: Prisma.CourseWhereInput;
};
export type CourseCreateNestedManyWithoutCreatorInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutCreatorInput, Prisma.CourseUncheckedCreateWithoutCreatorInput> | Prisma.CourseCreateWithoutCreatorInput[] | Prisma.CourseUncheckedCreateWithoutCreatorInput[];
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutCreatorInput | Prisma.CourseCreateOrConnectWithoutCreatorInput[];
    createMany?: Prisma.CourseCreateManyCreatorInputEnvelope;
    connect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
};
export type CourseCreateNestedManyWithoutTutorInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutTutorInput, Prisma.CourseUncheckedCreateWithoutTutorInput> | Prisma.CourseCreateWithoutTutorInput[] | Prisma.CourseUncheckedCreateWithoutTutorInput[];
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutTutorInput | Prisma.CourseCreateOrConnectWithoutTutorInput[];
    createMany?: Prisma.CourseCreateManyTutorInputEnvelope;
    connect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
};
export type CourseUncheckedCreateNestedManyWithoutCreatorInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutCreatorInput, Prisma.CourseUncheckedCreateWithoutCreatorInput> | Prisma.CourseCreateWithoutCreatorInput[] | Prisma.CourseUncheckedCreateWithoutCreatorInput[];
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutCreatorInput | Prisma.CourseCreateOrConnectWithoutCreatorInput[];
    createMany?: Prisma.CourseCreateManyCreatorInputEnvelope;
    connect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
};
export type CourseUncheckedCreateNestedManyWithoutTutorInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutTutorInput, Prisma.CourseUncheckedCreateWithoutTutorInput> | Prisma.CourseCreateWithoutTutorInput[] | Prisma.CourseUncheckedCreateWithoutTutorInput[];
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutTutorInput | Prisma.CourseCreateOrConnectWithoutTutorInput[];
    createMany?: Prisma.CourseCreateManyTutorInputEnvelope;
    connect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
};
export type CourseUpdateManyWithoutCreatorNestedInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutCreatorInput, Prisma.CourseUncheckedCreateWithoutCreatorInput> | Prisma.CourseCreateWithoutCreatorInput[] | Prisma.CourseUncheckedCreateWithoutCreatorInput[];
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutCreatorInput | Prisma.CourseCreateOrConnectWithoutCreatorInput[];
    upsert?: Prisma.CourseUpsertWithWhereUniqueWithoutCreatorInput | Prisma.CourseUpsertWithWhereUniqueWithoutCreatorInput[];
    createMany?: Prisma.CourseCreateManyCreatorInputEnvelope;
    set?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    disconnect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    delete?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    connect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    update?: Prisma.CourseUpdateWithWhereUniqueWithoutCreatorInput | Prisma.CourseUpdateWithWhereUniqueWithoutCreatorInput[];
    updateMany?: Prisma.CourseUpdateManyWithWhereWithoutCreatorInput | Prisma.CourseUpdateManyWithWhereWithoutCreatorInput[];
    deleteMany?: Prisma.CourseScalarWhereInput | Prisma.CourseScalarWhereInput[];
};
export type CourseUpdateManyWithoutTutorNestedInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutTutorInput, Prisma.CourseUncheckedCreateWithoutTutorInput> | Prisma.CourseCreateWithoutTutorInput[] | Prisma.CourseUncheckedCreateWithoutTutorInput[];
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutTutorInput | Prisma.CourseCreateOrConnectWithoutTutorInput[];
    upsert?: Prisma.CourseUpsertWithWhereUniqueWithoutTutorInput | Prisma.CourseUpsertWithWhereUniqueWithoutTutorInput[];
    createMany?: Prisma.CourseCreateManyTutorInputEnvelope;
    set?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    disconnect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    delete?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    connect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    update?: Prisma.CourseUpdateWithWhereUniqueWithoutTutorInput | Prisma.CourseUpdateWithWhereUniqueWithoutTutorInput[];
    updateMany?: Prisma.CourseUpdateManyWithWhereWithoutTutorInput | Prisma.CourseUpdateManyWithWhereWithoutTutorInput[];
    deleteMany?: Prisma.CourseScalarWhereInput | Prisma.CourseScalarWhereInput[];
};
export type CourseUncheckedUpdateManyWithoutCreatorNestedInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutCreatorInput, Prisma.CourseUncheckedCreateWithoutCreatorInput> | Prisma.CourseCreateWithoutCreatorInput[] | Prisma.CourseUncheckedCreateWithoutCreatorInput[];
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutCreatorInput | Prisma.CourseCreateOrConnectWithoutCreatorInput[];
    upsert?: Prisma.CourseUpsertWithWhereUniqueWithoutCreatorInput | Prisma.CourseUpsertWithWhereUniqueWithoutCreatorInput[];
    createMany?: Prisma.CourseCreateManyCreatorInputEnvelope;
    set?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    disconnect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    delete?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    connect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    update?: Prisma.CourseUpdateWithWhereUniqueWithoutCreatorInput | Prisma.CourseUpdateWithWhereUniqueWithoutCreatorInput[];
    updateMany?: Prisma.CourseUpdateManyWithWhereWithoutCreatorInput | Prisma.CourseUpdateManyWithWhereWithoutCreatorInput[];
    deleteMany?: Prisma.CourseScalarWhereInput | Prisma.CourseScalarWhereInput[];
};
export type CourseUncheckedUpdateManyWithoutTutorNestedInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutTutorInput, Prisma.CourseUncheckedCreateWithoutTutorInput> | Prisma.CourseCreateWithoutTutorInput[] | Prisma.CourseUncheckedCreateWithoutTutorInput[];
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutTutorInput | Prisma.CourseCreateOrConnectWithoutTutorInput[];
    upsert?: Prisma.CourseUpsertWithWhereUniqueWithoutTutorInput | Prisma.CourseUpsertWithWhereUniqueWithoutTutorInput[];
    createMany?: Prisma.CourseCreateManyTutorInputEnvelope;
    set?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    disconnect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    delete?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    connect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    update?: Prisma.CourseUpdateWithWhereUniqueWithoutTutorInput | Prisma.CourseUpdateWithWhereUniqueWithoutTutorInput[];
    updateMany?: Prisma.CourseUpdateManyWithWhereWithoutTutorInput | Prisma.CourseUpdateManyWithWhereWithoutTutorInput[];
    deleteMany?: Prisma.CourseScalarWhereInput | Prisma.CourseScalarWhereInput[];
};
export type CourseCreaterequirementsInput = {
    set: string[];
};
export type CourseCreateprerequisitesInput = {
    set: string[];
};
export type FloatFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type EnumCourseStatusFieldUpdateOperationsInput = {
    set?: $Enums.CourseStatus;
};
export type CourseUpdaterequirementsInput = {
    set?: string[];
    push?: string | string[];
};
export type CourseUpdateprerequisitesInput = {
    set?: string[];
    push?: string | string[];
};
export type CourseCreateNestedManyWithoutCategoryInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutCategoryInput, Prisma.CourseUncheckedCreateWithoutCategoryInput> | Prisma.CourseCreateWithoutCategoryInput[] | Prisma.CourseUncheckedCreateWithoutCategoryInput[];
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutCategoryInput | Prisma.CourseCreateOrConnectWithoutCategoryInput[];
    createMany?: Prisma.CourseCreateManyCategoryInputEnvelope;
    connect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
};
export type CourseUncheckedCreateNestedManyWithoutCategoryInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutCategoryInput, Prisma.CourseUncheckedCreateWithoutCategoryInput> | Prisma.CourseCreateWithoutCategoryInput[] | Prisma.CourseUncheckedCreateWithoutCategoryInput[];
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutCategoryInput | Prisma.CourseCreateOrConnectWithoutCategoryInput[];
    createMany?: Prisma.CourseCreateManyCategoryInputEnvelope;
    connect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
};
export type CourseUpdateManyWithoutCategoryNestedInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutCategoryInput, Prisma.CourseUncheckedCreateWithoutCategoryInput> | Prisma.CourseCreateWithoutCategoryInput[] | Prisma.CourseUncheckedCreateWithoutCategoryInput[];
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutCategoryInput | Prisma.CourseCreateOrConnectWithoutCategoryInput[];
    upsert?: Prisma.CourseUpsertWithWhereUniqueWithoutCategoryInput | Prisma.CourseUpsertWithWhereUniqueWithoutCategoryInput[];
    createMany?: Prisma.CourseCreateManyCategoryInputEnvelope;
    set?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    disconnect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    delete?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    connect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    update?: Prisma.CourseUpdateWithWhereUniqueWithoutCategoryInput | Prisma.CourseUpdateWithWhereUniqueWithoutCategoryInput[];
    updateMany?: Prisma.CourseUpdateManyWithWhereWithoutCategoryInput | Prisma.CourseUpdateManyWithWhereWithoutCategoryInput[];
    deleteMany?: Prisma.CourseScalarWhereInput | Prisma.CourseScalarWhereInput[];
};
export type CourseUncheckedUpdateManyWithoutCategoryNestedInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutCategoryInput, Prisma.CourseUncheckedCreateWithoutCategoryInput> | Prisma.CourseCreateWithoutCategoryInput[] | Prisma.CourseUncheckedCreateWithoutCategoryInput[];
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutCategoryInput | Prisma.CourseCreateOrConnectWithoutCategoryInput[];
    upsert?: Prisma.CourseUpsertWithWhereUniqueWithoutCategoryInput | Prisma.CourseUpsertWithWhereUniqueWithoutCategoryInput[];
    createMany?: Prisma.CourseCreateManyCategoryInputEnvelope;
    set?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    disconnect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    delete?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    connect?: Prisma.CourseWhereUniqueInput | Prisma.CourseWhereUniqueInput[];
    update?: Prisma.CourseUpdateWithWhereUniqueWithoutCategoryInput | Prisma.CourseUpdateWithWhereUniqueWithoutCategoryInput[];
    updateMany?: Prisma.CourseUpdateManyWithWhereWithoutCategoryInput | Prisma.CourseUpdateManyWithWhereWithoutCategoryInput[];
    deleteMany?: Prisma.CourseScalarWhereInput | Prisma.CourseScalarWhereInput[];
};
export type CourseCreateNestedOneWithoutModulesInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutModulesInput, Prisma.CourseUncheckedCreateWithoutModulesInput>;
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutModulesInput;
    connect?: Prisma.CourseWhereUniqueInput;
};
export type CourseUpdateOneRequiredWithoutModulesNestedInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutModulesInput, Prisma.CourseUncheckedCreateWithoutModulesInput>;
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutModulesInput;
    upsert?: Prisma.CourseUpsertWithoutModulesInput;
    connect?: Prisma.CourseWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.CourseUpdateToOneWithWhereWithoutModulesInput, Prisma.CourseUpdateWithoutModulesInput>, Prisma.CourseUncheckedUpdateWithoutModulesInput>;
};
export type CourseCreateNestedOneWithoutMaterialsInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutMaterialsInput, Prisma.CourseUncheckedCreateWithoutMaterialsInput>;
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutMaterialsInput;
    connect?: Prisma.CourseWhereUniqueInput;
};
export type CourseUpdateOneRequiredWithoutMaterialsNestedInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutMaterialsInput, Prisma.CourseUncheckedCreateWithoutMaterialsInput>;
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutMaterialsInput;
    upsert?: Prisma.CourseUpsertWithoutMaterialsInput;
    connect?: Prisma.CourseWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.CourseUpdateToOneWithWhereWithoutMaterialsInput, Prisma.CourseUpdateWithoutMaterialsInput>, Prisma.CourseUncheckedUpdateWithoutMaterialsInput>;
};
export type CourseCreateNestedOneWithoutEnrollmentsInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutEnrollmentsInput, Prisma.CourseUncheckedCreateWithoutEnrollmentsInput>;
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutEnrollmentsInput;
    connect?: Prisma.CourseWhereUniqueInput;
};
export type CourseUpdateOneRequiredWithoutEnrollmentsNestedInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutEnrollmentsInput, Prisma.CourseUncheckedCreateWithoutEnrollmentsInput>;
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutEnrollmentsInput;
    upsert?: Prisma.CourseUpsertWithoutEnrollmentsInput;
    connect?: Prisma.CourseWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.CourseUpdateToOneWithWhereWithoutEnrollmentsInput, Prisma.CourseUpdateWithoutEnrollmentsInput>, Prisma.CourseUncheckedUpdateWithoutEnrollmentsInput>;
};
export type CourseCreateNestedOneWithoutAssignmentsInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutAssignmentsInput, Prisma.CourseUncheckedCreateWithoutAssignmentsInput>;
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutAssignmentsInput;
    connect?: Prisma.CourseWhereUniqueInput;
};
export type CourseUpdateOneRequiredWithoutAssignmentsNestedInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutAssignmentsInput, Prisma.CourseUncheckedCreateWithoutAssignmentsInput>;
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutAssignmentsInput;
    upsert?: Prisma.CourseUpsertWithoutAssignmentsInput;
    connect?: Prisma.CourseWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.CourseUpdateToOneWithWhereWithoutAssignmentsInput, Prisma.CourseUpdateWithoutAssignmentsInput>, Prisma.CourseUncheckedUpdateWithoutAssignmentsInput>;
};
export type CourseCreateNestedOneWithoutReviewsInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutReviewsInput, Prisma.CourseUncheckedCreateWithoutReviewsInput>;
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutReviewsInput;
    connect?: Prisma.CourseWhereUniqueInput;
};
export type CourseUpdateOneRequiredWithoutReviewsNestedInput = {
    create?: Prisma.XOR<Prisma.CourseCreateWithoutReviewsInput, Prisma.CourseUncheckedCreateWithoutReviewsInput>;
    connectOrCreate?: Prisma.CourseCreateOrConnectWithoutReviewsInput;
    upsert?: Prisma.CourseUpsertWithoutReviewsInput;
    connect?: Prisma.CourseWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.CourseUpdateToOneWithWhereWithoutReviewsInput, Prisma.CourseUpdateWithoutReviewsInput>, Prisma.CourseUncheckedUpdateWithoutReviewsInput>;
};
export type CourseCreateWithoutCreatorInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    tutor?: Prisma.AdminCreateNestedOneWithoutAssignedCoursesInput;
    category?: Prisma.CategoryCreateNestedOneWithoutCoursesInput;
    enrollments?: Prisma.EnrollmentCreateNestedManyWithoutCourseInput;
    modules?: Prisma.CourseModuleCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewCreateNestedManyWithoutCourseInput;
};
export type CourseUncheckedCreateWithoutCreatorInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    tutorId?: string | null;
    categoryId?: string | null;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    enrollments?: Prisma.EnrollmentUncheckedCreateNestedManyWithoutCourseInput;
    modules?: Prisma.CourseModuleUncheckedCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialUncheckedCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentUncheckedCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewUncheckedCreateNestedManyWithoutCourseInput;
};
export type CourseCreateOrConnectWithoutCreatorInput = {
    where: Prisma.CourseWhereUniqueInput;
    create: Prisma.XOR<Prisma.CourseCreateWithoutCreatorInput, Prisma.CourseUncheckedCreateWithoutCreatorInput>;
};
export type CourseCreateManyCreatorInputEnvelope = {
    data: Prisma.CourseCreateManyCreatorInput | Prisma.CourseCreateManyCreatorInput[];
    skipDuplicates?: boolean;
};
export type CourseCreateWithoutTutorInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    creator: Prisma.AdminCreateNestedOneWithoutCreatedCoursesInput;
    category?: Prisma.CategoryCreateNestedOneWithoutCoursesInput;
    enrollments?: Prisma.EnrollmentCreateNestedManyWithoutCourseInput;
    modules?: Prisma.CourseModuleCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewCreateNestedManyWithoutCourseInput;
};
export type CourseUncheckedCreateWithoutTutorInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    creatorId: string;
    categoryId?: string | null;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    enrollments?: Prisma.EnrollmentUncheckedCreateNestedManyWithoutCourseInput;
    modules?: Prisma.CourseModuleUncheckedCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialUncheckedCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentUncheckedCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewUncheckedCreateNestedManyWithoutCourseInput;
};
export type CourseCreateOrConnectWithoutTutorInput = {
    where: Prisma.CourseWhereUniqueInput;
    create: Prisma.XOR<Prisma.CourseCreateWithoutTutorInput, Prisma.CourseUncheckedCreateWithoutTutorInput>;
};
export type CourseCreateManyTutorInputEnvelope = {
    data: Prisma.CourseCreateManyTutorInput | Prisma.CourseCreateManyTutorInput[];
    skipDuplicates?: boolean;
};
export type CourseUpsertWithWhereUniqueWithoutCreatorInput = {
    where: Prisma.CourseWhereUniqueInput;
    update: Prisma.XOR<Prisma.CourseUpdateWithoutCreatorInput, Prisma.CourseUncheckedUpdateWithoutCreatorInput>;
    create: Prisma.XOR<Prisma.CourseCreateWithoutCreatorInput, Prisma.CourseUncheckedCreateWithoutCreatorInput>;
};
export type CourseUpdateWithWhereUniqueWithoutCreatorInput = {
    where: Prisma.CourseWhereUniqueInput;
    data: Prisma.XOR<Prisma.CourseUpdateWithoutCreatorInput, Prisma.CourseUncheckedUpdateWithoutCreatorInput>;
};
export type CourseUpdateManyWithWhereWithoutCreatorInput = {
    where: Prisma.CourseScalarWhereInput;
    data: Prisma.XOR<Prisma.CourseUpdateManyMutationInput, Prisma.CourseUncheckedUpdateManyWithoutCreatorInput>;
};
export type CourseScalarWhereInput = {
    AND?: Prisma.CourseScalarWhereInput | Prisma.CourseScalarWhereInput[];
    OR?: Prisma.CourseScalarWhereInput[];
    NOT?: Prisma.CourseScalarWhereInput | Prisma.CourseScalarWhereInput[];
    id?: Prisma.StringFilter<"Course"> | string;
    title?: Prisma.StringFilter<"Course"> | string;
    description?: Prisma.StringFilter<"Course"> | string;
    thumbnail?: Prisma.StringNullableFilter<"Course"> | string | null;
    price?: Prisma.FloatFilter<"Course"> | number;
    duration?: Prisma.IntNullableFilter<"Course"> | number | null;
    level?: Prisma.StringNullableFilter<"Course"> | string | null;
    status?: Prisma.EnumCourseStatusFilter<"Course"> | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFilter<"Course"> | boolean;
    creatorId?: Prisma.StringFilter<"Course"> | string;
    tutorId?: Prisma.StringNullableFilter<"Course"> | string | null;
    categoryId?: Prisma.StringNullableFilter<"Course"> | string | null;
    tutorName?: Prisma.StringNullableFilter<"Course"> | string | null;
    requirements?: Prisma.StringNullableListFilter<"Course">;
    prerequisites?: Prisma.StringNullableListFilter<"Course">;
    rejectionReason?: Prisma.StringNullableFilter<"Course"> | string | null;
    rejectedAt?: Prisma.DateTimeNullableFilter<"Course"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"Course"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Course"> | Date | string;
};
export type CourseUpsertWithWhereUniqueWithoutTutorInput = {
    where: Prisma.CourseWhereUniqueInput;
    update: Prisma.XOR<Prisma.CourseUpdateWithoutTutorInput, Prisma.CourseUncheckedUpdateWithoutTutorInput>;
    create: Prisma.XOR<Prisma.CourseCreateWithoutTutorInput, Prisma.CourseUncheckedCreateWithoutTutorInput>;
};
export type CourseUpdateWithWhereUniqueWithoutTutorInput = {
    where: Prisma.CourseWhereUniqueInput;
    data: Prisma.XOR<Prisma.CourseUpdateWithoutTutorInput, Prisma.CourseUncheckedUpdateWithoutTutorInput>;
};
export type CourseUpdateManyWithWhereWithoutTutorInput = {
    where: Prisma.CourseScalarWhereInput;
    data: Prisma.XOR<Prisma.CourseUpdateManyMutationInput, Prisma.CourseUncheckedUpdateManyWithoutTutorInput>;
};
export type CourseCreateWithoutCategoryInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    creator: Prisma.AdminCreateNestedOneWithoutCreatedCoursesInput;
    tutor?: Prisma.AdminCreateNestedOneWithoutAssignedCoursesInput;
    enrollments?: Prisma.EnrollmentCreateNestedManyWithoutCourseInput;
    modules?: Prisma.CourseModuleCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewCreateNestedManyWithoutCourseInput;
};
export type CourseUncheckedCreateWithoutCategoryInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    creatorId: string;
    tutorId?: string | null;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    enrollments?: Prisma.EnrollmentUncheckedCreateNestedManyWithoutCourseInput;
    modules?: Prisma.CourseModuleUncheckedCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialUncheckedCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentUncheckedCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewUncheckedCreateNestedManyWithoutCourseInput;
};
export type CourseCreateOrConnectWithoutCategoryInput = {
    where: Prisma.CourseWhereUniqueInput;
    create: Prisma.XOR<Prisma.CourseCreateWithoutCategoryInput, Prisma.CourseUncheckedCreateWithoutCategoryInput>;
};
export type CourseCreateManyCategoryInputEnvelope = {
    data: Prisma.CourseCreateManyCategoryInput | Prisma.CourseCreateManyCategoryInput[];
    skipDuplicates?: boolean;
};
export type CourseUpsertWithWhereUniqueWithoutCategoryInput = {
    where: Prisma.CourseWhereUniqueInput;
    update: Prisma.XOR<Prisma.CourseUpdateWithoutCategoryInput, Prisma.CourseUncheckedUpdateWithoutCategoryInput>;
    create: Prisma.XOR<Prisma.CourseCreateWithoutCategoryInput, Prisma.CourseUncheckedCreateWithoutCategoryInput>;
};
export type CourseUpdateWithWhereUniqueWithoutCategoryInput = {
    where: Prisma.CourseWhereUniqueInput;
    data: Prisma.XOR<Prisma.CourseUpdateWithoutCategoryInput, Prisma.CourseUncheckedUpdateWithoutCategoryInput>;
};
export type CourseUpdateManyWithWhereWithoutCategoryInput = {
    where: Prisma.CourseScalarWhereInput;
    data: Prisma.XOR<Prisma.CourseUpdateManyMutationInput, Prisma.CourseUncheckedUpdateManyWithoutCategoryInput>;
};
export type CourseCreateWithoutModulesInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    creator: Prisma.AdminCreateNestedOneWithoutCreatedCoursesInput;
    tutor?: Prisma.AdminCreateNestedOneWithoutAssignedCoursesInput;
    category?: Prisma.CategoryCreateNestedOneWithoutCoursesInput;
    enrollments?: Prisma.EnrollmentCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewCreateNestedManyWithoutCourseInput;
};
export type CourseUncheckedCreateWithoutModulesInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    creatorId: string;
    tutorId?: string | null;
    categoryId?: string | null;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    enrollments?: Prisma.EnrollmentUncheckedCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialUncheckedCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentUncheckedCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewUncheckedCreateNestedManyWithoutCourseInput;
};
export type CourseCreateOrConnectWithoutModulesInput = {
    where: Prisma.CourseWhereUniqueInput;
    create: Prisma.XOR<Prisma.CourseCreateWithoutModulesInput, Prisma.CourseUncheckedCreateWithoutModulesInput>;
};
export type CourseUpsertWithoutModulesInput = {
    update: Prisma.XOR<Prisma.CourseUpdateWithoutModulesInput, Prisma.CourseUncheckedUpdateWithoutModulesInput>;
    create: Prisma.XOR<Prisma.CourseCreateWithoutModulesInput, Prisma.CourseUncheckedCreateWithoutModulesInput>;
    where?: Prisma.CourseWhereInput;
};
export type CourseUpdateToOneWithWhereWithoutModulesInput = {
    where?: Prisma.CourseWhereInput;
    data: Prisma.XOR<Prisma.CourseUpdateWithoutModulesInput, Prisma.CourseUncheckedUpdateWithoutModulesInput>;
};
export type CourseUpdateWithoutModulesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    creator?: Prisma.AdminUpdateOneRequiredWithoutCreatedCoursesNestedInput;
    tutor?: Prisma.AdminUpdateOneWithoutAssignedCoursesNestedInput;
    category?: Prisma.CategoryUpdateOneWithoutCoursesNestedInput;
    enrollments?: Prisma.EnrollmentUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUpdateManyWithoutCourseNestedInput;
};
export type CourseUncheckedUpdateWithoutModulesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    creatorId?: Prisma.StringFieldUpdateOperationsInput | string;
    tutorId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    enrollments?: Prisma.EnrollmentUncheckedUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUncheckedUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUncheckedUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUncheckedUpdateManyWithoutCourseNestedInput;
};
export type CourseCreateWithoutMaterialsInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    creator: Prisma.AdminCreateNestedOneWithoutCreatedCoursesInput;
    tutor?: Prisma.AdminCreateNestedOneWithoutAssignedCoursesInput;
    category?: Prisma.CategoryCreateNestedOneWithoutCoursesInput;
    enrollments?: Prisma.EnrollmentCreateNestedManyWithoutCourseInput;
    modules?: Prisma.CourseModuleCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewCreateNestedManyWithoutCourseInput;
};
export type CourseUncheckedCreateWithoutMaterialsInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    creatorId: string;
    tutorId?: string | null;
    categoryId?: string | null;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    enrollments?: Prisma.EnrollmentUncheckedCreateNestedManyWithoutCourseInput;
    modules?: Prisma.CourseModuleUncheckedCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentUncheckedCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewUncheckedCreateNestedManyWithoutCourseInput;
};
export type CourseCreateOrConnectWithoutMaterialsInput = {
    where: Prisma.CourseWhereUniqueInput;
    create: Prisma.XOR<Prisma.CourseCreateWithoutMaterialsInput, Prisma.CourseUncheckedCreateWithoutMaterialsInput>;
};
export type CourseUpsertWithoutMaterialsInput = {
    update: Prisma.XOR<Prisma.CourseUpdateWithoutMaterialsInput, Prisma.CourseUncheckedUpdateWithoutMaterialsInput>;
    create: Prisma.XOR<Prisma.CourseCreateWithoutMaterialsInput, Prisma.CourseUncheckedCreateWithoutMaterialsInput>;
    where?: Prisma.CourseWhereInput;
};
export type CourseUpdateToOneWithWhereWithoutMaterialsInput = {
    where?: Prisma.CourseWhereInput;
    data: Prisma.XOR<Prisma.CourseUpdateWithoutMaterialsInput, Prisma.CourseUncheckedUpdateWithoutMaterialsInput>;
};
export type CourseUpdateWithoutMaterialsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    creator?: Prisma.AdminUpdateOneRequiredWithoutCreatedCoursesNestedInput;
    tutor?: Prisma.AdminUpdateOneWithoutAssignedCoursesNestedInput;
    category?: Prisma.CategoryUpdateOneWithoutCoursesNestedInput;
    enrollments?: Prisma.EnrollmentUpdateManyWithoutCourseNestedInput;
    modules?: Prisma.CourseModuleUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUpdateManyWithoutCourseNestedInput;
};
export type CourseUncheckedUpdateWithoutMaterialsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    creatorId?: Prisma.StringFieldUpdateOperationsInput | string;
    tutorId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    enrollments?: Prisma.EnrollmentUncheckedUpdateManyWithoutCourseNestedInput;
    modules?: Prisma.CourseModuleUncheckedUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUncheckedUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUncheckedUpdateManyWithoutCourseNestedInput;
};
export type CourseCreateWithoutEnrollmentsInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    creator: Prisma.AdminCreateNestedOneWithoutCreatedCoursesInput;
    tutor?: Prisma.AdminCreateNestedOneWithoutAssignedCoursesInput;
    category?: Prisma.CategoryCreateNestedOneWithoutCoursesInput;
    modules?: Prisma.CourseModuleCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewCreateNestedManyWithoutCourseInput;
};
export type CourseUncheckedCreateWithoutEnrollmentsInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    creatorId: string;
    tutorId?: string | null;
    categoryId?: string | null;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    modules?: Prisma.CourseModuleUncheckedCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialUncheckedCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentUncheckedCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewUncheckedCreateNestedManyWithoutCourseInput;
};
export type CourseCreateOrConnectWithoutEnrollmentsInput = {
    where: Prisma.CourseWhereUniqueInput;
    create: Prisma.XOR<Prisma.CourseCreateWithoutEnrollmentsInput, Prisma.CourseUncheckedCreateWithoutEnrollmentsInput>;
};
export type CourseUpsertWithoutEnrollmentsInput = {
    update: Prisma.XOR<Prisma.CourseUpdateWithoutEnrollmentsInput, Prisma.CourseUncheckedUpdateWithoutEnrollmentsInput>;
    create: Prisma.XOR<Prisma.CourseCreateWithoutEnrollmentsInput, Prisma.CourseUncheckedCreateWithoutEnrollmentsInput>;
    where?: Prisma.CourseWhereInput;
};
export type CourseUpdateToOneWithWhereWithoutEnrollmentsInput = {
    where?: Prisma.CourseWhereInput;
    data: Prisma.XOR<Prisma.CourseUpdateWithoutEnrollmentsInput, Prisma.CourseUncheckedUpdateWithoutEnrollmentsInput>;
};
export type CourseUpdateWithoutEnrollmentsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    creator?: Prisma.AdminUpdateOneRequiredWithoutCreatedCoursesNestedInput;
    tutor?: Prisma.AdminUpdateOneWithoutAssignedCoursesNestedInput;
    category?: Prisma.CategoryUpdateOneWithoutCoursesNestedInput;
    modules?: Prisma.CourseModuleUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUpdateManyWithoutCourseNestedInput;
};
export type CourseUncheckedUpdateWithoutEnrollmentsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    creatorId?: Prisma.StringFieldUpdateOperationsInput | string;
    tutorId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    modules?: Prisma.CourseModuleUncheckedUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUncheckedUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUncheckedUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUncheckedUpdateManyWithoutCourseNestedInput;
};
export type CourseCreateWithoutAssignmentsInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    creator: Prisma.AdminCreateNestedOneWithoutCreatedCoursesInput;
    tutor?: Prisma.AdminCreateNestedOneWithoutAssignedCoursesInput;
    category?: Prisma.CategoryCreateNestedOneWithoutCoursesInput;
    enrollments?: Prisma.EnrollmentCreateNestedManyWithoutCourseInput;
    modules?: Prisma.CourseModuleCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewCreateNestedManyWithoutCourseInput;
};
export type CourseUncheckedCreateWithoutAssignmentsInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    creatorId: string;
    tutorId?: string | null;
    categoryId?: string | null;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    enrollments?: Prisma.EnrollmentUncheckedCreateNestedManyWithoutCourseInput;
    modules?: Prisma.CourseModuleUncheckedCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialUncheckedCreateNestedManyWithoutCourseInput;
    reviews?: Prisma.ReviewUncheckedCreateNestedManyWithoutCourseInput;
};
export type CourseCreateOrConnectWithoutAssignmentsInput = {
    where: Prisma.CourseWhereUniqueInput;
    create: Prisma.XOR<Prisma.CourseCreateWithoutAssignmentsInput, Prisma.CourseUncheckedCreateWithoutAssignmentsInput>;
};
export type CourseUpsertWithoutAssignmentsInput = {
    update: Prisma.XOR<Prisma.CourseUpdateWithoutAssignmentsInput, Prisma.CourseUncheckedUpdateWithoutAssignmentsInput>;
    create: Prisma.XOR<Prisma.CourseCreateWithoutAssignmentsInput, Prisma.CourseUncheckedCreateWithoutAssignmentsInput>;
    where?: Prisma.CourseWhereInput;
};
export type CourseUpdateToOneWithWhereWithoutAssignmentsInput = {
    where?: Prisma.CourseWhereInput;
    data: Prisma.XOR<Prisma.CourseUpdateWithoutAssignmentsInput, Prisma.CourseUncheckedUpdateWithoutAssignmentsInput>;
};
export type CourseUpdateWithoutAssignmentsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    creator?: Prisma.AdminUpdateOneRequiredWithoutCreatedCoursesNestedInput;
    tutor?: Prisma.AdminUpdateOneWithoutAssignedCoursesNestedInput;
    category?: Prisma.CategoryUpdateOneWithoutCoursesNestedInput;
    enrollments?: Prisma.EnrollmentUpdateManyWithoutCourseNestedInput;
    modules?: Prisma.CourseModuleUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUpdateManyWithoutCourseNestedInput;
};
export type CourseUncheckedUpdateWithoutAssignmentsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    creatorId?: Prisma.StringFieldUpdateOperationsInput | string;
    tutorId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    enrollments?: Prisma.EnrollmentUncheckedUpdateManyWithoutCourseNestedInput;
    modules?: Prisma.CourseModuleUncheckedUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUncheckedUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUncheckedUpdateManyWithoutCourseNestedInput;
};
export type CourseCreateWithoutReviewsInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    creator: Prisma.AdminCreateNestedOneWithoutCreatedCoursesInput;
    tutor?: Prisma.AdminCreateNestedOneWithoutAssignedCoursesInput;
    category?: Prisma.CategoryCreateNestedOneWithoutCoursesInput;
    enrollments?: Prisma.EnrollmentCreateNestedManyWithoutCourseInput;
    modules?: Prisma.CourseModuleCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentCreateNestedManyWithoutCourseInput;
};
export type CourseUncheckedCreateWithoutReviewsInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    creatorId: string;
    tutorId?: string | null;
    categoryId?: string | null;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    enrollments?: Prisma.EnrollmentUncheckedCreateNestedManyWithoutCourseInput;
    modules?: Prisma.CourseModuleUncheckedCreateNestedManyWithoutCourseInput;
    materials?: Prisma.MaterialUncheckedCreateNestedManyWithoutCourseInput;
    assignments?: Prisma.AssignmentUncheckedCreateNestedManyWithoutCourseInput;
};
export type CourseCreateOrConnectWithoutReviewsInput = {
    where: Prisma.CourseWhereUniqueInput;
    create: Prisma.XOR<Prisma.CourseCreateWithoutReviewsInput, Prisma.CourseUncheckedCreateWithoutReviewsInput>;
};
export type CourseUpsertWithoutReviewsInput = {
    update: Prisma.XOR<Prisma.CourseUpdateWithoutReviewsInput, Prisma.CourseUncheckedUpdateWithoutReviewsInput>;
    create: Prisma.XOR<Prisma.CourseCreateWithoutReviewsInput, Prisma.CourseUncheckedCreateWithoutReviewsInput>;
    where?: Prisma.CourseWhereInput;
};
export type CourseUpdateToOneWithWhereWithoutReviewsInput = {
    where?: Prisma.CourseWhereInput;
    data: Prisma.XOR<Prisma.CourseUpdateWithoutReviewsInput, Prisma.CourseUncheckedUpdateWithoutReviewsInput>;
};
export type CourseUpdateWithoutReviewsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    creator?: Prisma.AdminUpdateOneRequiredWithoutCreatedCoursesNestedInput;
    tutor?: Prisma.AdminUpdateOneWithoutAssignedCoursesNestedInput;
    category?: Prisma.CategoryUpdateOneWithoutCoursesNestedInput;
    enrollments?: Prisma.EnrollmentUpdateManyWithoutCourseNestedInput;
    modules?: Prisma.CourseModuleUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUpdateManyWithoutCourseNestedInput;
};
export type CourseUncheckedUpdateWithoutReviewsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    creatorId?: Prisma.StringFieldUpdateOperationsInput | string;
    tutorId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    enrollments?: Prisma.EnrollmentUncheckedUpdateManyWithoutCourseNestedInput;
    modules?: Prisma.CourseModuleUncheckedUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUncheckedUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUncheckedUpdateManyWithoutCourseNestedInput;
};
export type CourseCreateManyCreatorInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    tutorId?: string | null;
    categoryId?: string | null;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type CourseCreateManyTutorInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    creatorId: string;
    categoryId?: string | null;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type CourseUpdateWithoutCreatorInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    tutor?: Prisma.AdminUpdateOneWithoutAssignedCoursesNestedInput;
    category?: Prisma.CategoryUpdateOneWithoutCoursesNestedInput;
    enrollments?: Prisma.EnrollmentUpdateManyWithoutCourseNestedInput;
    modules?: Prisma.CourseModuleUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUpdateManyWithoutCourseNestedInput;
};
export type CourseUncheckedUpdateWithoutCreatorInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    tutorId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    enrollments?: Prisma.EnrollmentUncheckedUpdateManyWithoutCourseNestedInput;
    modules?: Prisma.CourseModuleUncheckedUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUncheckedUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUncheckedUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUncheckedUpdateManyWithoutCourseNestedInput;
};
export type CourseUncheckedUpdateManyWithoutCreatorInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    tutorId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CourseUpdateWithoutTutorInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    creator?: Prisma.AdminUpdateOneRequiredWithoutCreatedCoursesNestedInput;
    category?: Prisma.CategoryUpdateOneWithoutCoursesNestedInput;
    enrollments?: Prisma.EnrollmentUpdateManyWithoutCourseNestedInput;
    modules?: Prisma.CourseModuleUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUpdateManyWithoutCourseNestedInput;
};
export type CourseUncheckedUpdateWithoutTutorInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    creatorId?: Prisma.StringFieldUpdateOperationsInput | string;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    enrollments?: Prisma.EnrollmentUncheckedUpdateManyWithoutCourseNestedInput;
    modules?: Prisma.CourseModuleUncheckedUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUncheckedUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUncheckedUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUncheckedUpdateManyWithoutCourseNestedInput;
};
export type CourseUncheckedUpdateManyWithoutTutorInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    creatorId?: Prisma.StringFieldUpdateOperationsInput | string;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CourseCreateManyCategoryInput = {
    id?: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    price?: number;
    duration?: number | null;
    level?: string | null;
    status?: $Enums.CourseStatus;
    isPublic?: boolean;
    creatorId: string;
    tutorId?: string | null;
    tutorName?: string | null;
    requirements?: Prisma.CourseCreaterequirementsInput | string[];
    prerequisites?: Prisma.CourseCreateprerequisitesInput | string[];
    rejectionReason?: string | null;
    rejectedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type CourseUpdateWithoutCategoryInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    creator?: Prisma.AdminUpdateOneRequiredWithoutCreatedCoursesNestedInput;
    tutor?: Prisma.AdminUpdateOneWithoutAssignedCoursesNestedInput;
    enrollments?: Prisma.EnrollmentUpdateManyWithoutCourseNestedInput;
    modules?: Prisma.CourseModuleUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUpdateManyWithoutCourseNestedInput;
};
export type CourseUncheckedUpdateWithoutCategoryInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    creatorId?: Prisma.StringFieldUpdateOperationsInput | string;
    tutorId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    enrollments?: Prisma.EnrollmentUncheckedUpdateManyWithoutCourseNestedInput;
    modules?: Prisma.CourseModuleUncheckedUpdateManyWithoutCourseNestedInput;
    materials?: Prisma.MaterialUncheckedUpdateManyWithoutCourseNestedInput;
    assignments?: Prisma.AssignmentUncheckedUpdateManyWithoutCourseNestedInput;
    reviews?: Prisma.ReviewUncheckedUpdateManyWithoutCourseNestedInput;
};
export type CourseUncheckedUpdateManyWithoutCategoryInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbnail?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.FloatFieldUpdateOperationsInput | number;
    duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    level?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus;
    isPublic?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    creatorId?: Prisma.StringFieldUpdateOperationsInput | string;
    tutorId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tutorName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: Prisma.CourseUpdaterequirementsInput | string[];
    prerequisites?: Prisma.CourseUpdateprerequisitesInput | string[];
    rejectionReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    rejectedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
/**
 * Count Type CourseCountOutputType
 */
export type CourseCountOutputType = {
    enrollments: number;
    modules: number;
    materials: number;
    assignments: number;
    reviews: number;
};
export type CourseCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    enrollments?: boolean | CourseCountOutputTypeCountEnrollmentsArgs;
    modules?: boolean | CourseCountOutputTypeCountModulesArgs;
    materials?: boolean | CourseCountOutputTypeCountMaterialsArgs;
    assignments?: boolean | CourseCountOutputTypeCountAssignmentsArgs;
    reviews?: boolean | CourseCountOutputTypeCountReviewsArgs;
};
/**
 * CourseCountOutputType without action
 */
export type CourseCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseCountOutputType
     */
    select?: Prisma.CourseCountOutputTypeSelect<ExtArgs> | null;
};
/**
 * CourseCountOutputType without action
 */
export type CourseCountOutputTypeCountEnrollmentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.EnrollmentWhereInput;
};
/**
 * CourseCountOutputType without action
 */
export type CourseCountOutputTypeCountModulesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CourseModuleWhereInput;
};
/**
 * CourseCountOutputType without action
 */
export type CourseCountOutputTypeCountMaterialsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MaterialWhereInput;
};
/**
 * CourseCountOutputType without action
 */
export type CourseCountOutputTypeCountAssignmentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AssignmentWhereInput;
};
/**
 * CourseCountOutputType without action
 */
export type CourseCountOutputTypeCountReviewsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ReviewWhereInput;
};
export type CourseSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    title?: boolean;
    description?: boolean;
    thumbnail?: boolean;
    price?: boolean;
    duration?: boolean;
    level?: boolean;
    status?: boolean;
    isPublic?: boolean;
    creatorId?: boolean;
    tutorId?: boolean;
    categoryId?: boolean;
    tutorName?: boolean;
    requirements?: boolean;
    prerequisites?: boolean;
    rejectionReason?: boolean;
    rejectedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    creator?: boolean | Prisma.AdminDefaultArgs<ExtArgs>;
    tutor?: boolean | Prisma.Course$tutorArgs<ExtArgs>;
    category?: boolean | Prisma.Course$categoryArgs<ExtArgs>;
    enrollments?: boolean | Prisma.Course$enrollmentsArgs<ExtArgs>;
    modules?: boolean | Prisma.Course$modulesArgs<ExtArgs>;
    materials?: boolean | Prisma.Course$materialsArgs<ExtArgs>;
    assignments?: boolean | Prisma.Course$assignmentsArgs<ExtArgs>;
    reviews?: boolean | Prisma.Course$reviewsArgs<ExtArgs>;
    _count?: boolean | Prisma.CourseCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["course"]>;
export type CourseSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    title?: boolean;
    description?: boolean;
    thumbnail?: boolean;
    price?: boolean;
    duration?: boolean;
    level?: boolean;
    status?: boolean;
    isPublic?: boolean;
    creatorId?: boolean;
    tutorId?: boolean;
    categoryId?: boolean;
    tutorName?: boolean;
    requirements?: boolean;
    prerequisites?: boolean;
    rejectionReason?: boolean;
    rejectedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    creator?: boolean | Prisma.AdminDefaultArgs<ExtArgs>;
    tutor?: boolean | Prisma.Course$tutorArgs<ExtArgs>;
    category?: boolean | Prisma.Course$categoryArgs<ExtArgs>;
}, ExtArgs["result"]["course"]>;
export type CourseSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    title?: boolean;
    description?: boolean;
    thumbnail?: boolean;
    price?: boolean;
    duration?: boolean;
    level?: boolean;
    status?: boolean;
    isPublic?: boolean;
    creatorId?: boolean;
    tutorId?: boolean;
    categoryId?: boolean;
    tutorName?: boolean;
    requirements?: boolean;
    prerequisites?: boolean;
    rejectionReason?: boolean;
    rejectedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    creator?: boolean | Prisma.AdminDefaultArgs<ExtArgs>;
    tutor?: boolean | Prisma.Course$tutorArgs<ExtArgs>;
    category?: boolean | Prisma.Course$categoryArgs<ExtArgs>;
}, ExtArgs["result"]["course"]>;
export type CourseSelectScalar = {
    id?: boolean;
    title?: boolean;
    description?: boolean;
    thumbnail?: boolean;
    price?: boolean;
    duration?: boolean;
    level?: boolean;
    status?: boolean;
    isPublic?: boolean;
    creatorId?: boolean;
    tutorId?: boolean;
    categoryId?: boolean;
    tutorName?: boolean;
    requirements?: boolean;
    prerequisites?: boolean;
    rejectionReason?: boolean;
    rejectedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type CourseOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "title" | "description" | "thumbnail" | "price" | "duration" | "level" | "status" | "isPublic" | "creatorId" | "tutorId" | "categoryId" | "tutorName" | "requirements" | "prerequisites" | "rejectionReason" | "rejectedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["course"]>;
export type CourseInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    creator?: boolean | Prisma.AdminDefaultArgs<ExtArgs>;
    tutor?: boolean | Prisma.Course$tutorArgs<ExtArgs>;
    category?: boolean | Prisma.Course$categoryArgs<ExtArgs>;
    enrollments?: boolean | Prisma.Course$enrollmentsArgs<ExtArgs>;
    modules?: boolean | Prisma.Course$modulesArgs<ExtArgs>;
    materials?: boolean | Prisma.Course$materialsArgs<ExtArgs>;
    assignments?: boolean | Prisma.Course$assignmentsArgs<ExtArgs>;
    reviews?: boolean | Prisma.Course$reviewsArgs<ExtArgs>;
    _count?: boolean | Prisma.CourseCountOutputTypeDefaultArgs<ExtArgs>;
};
export type CourseIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    creator?: boolean | Prisma.AdminDefaultArgs<ExtArgs>;
    tutor?: boolean | Prisma.Course$tutorArgs<ExtArgs>;
    category?: boolean | Prisma.Course$categoryArgs<ExtArgs>;
};
export type CourseIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    creator?: boolean | Prisma.AdminDefaultArgs<ExtArgs>;
    tutor?: boolean | Prisma.Course$tutorArgs<ExtArgs>;
    category?: boolean | Prisma.Course$categoryArgs<ExtArgs>;
};
export type $CoursePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Course";
    objects: {
        creator: Prisma.$AdminPayload<ExtArgs>;
        tutor: Prisma.$AdminPayload<ExtArgs> | null;
        category: Prisma.$CategoryPayload<ExtArgs> | null;
        enrollments: Prisma.$EnrollmentPayload<ExtArgs>[];
        modules: Prisma.$CourseModulePayload<ExtArgs>[];
        materials: Prisma.$MaterialPayload<ExtArgs>[];
        assignments: Prisma.$AssignmentPayload<ExtArgs>[];
        reviews: Prisma.$ReviewPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        title: string;
        description: string;
        thumbnail: string | null;
        price: number;
        duration: number | null;
        level: string | null;
        status: $Enums.CourseStatus;
        isPublic: boolean;
        creatorId: string;
        tutorId: string | null;
        categoryId: string | null;
        tutorName: string | null;
        requirements: string[];
        prerequisites: string[];
        rejectionReason: string | null;
        rejectedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["course"]>;
    composites: {};
};
export type CourseGetPayload<S extends boolean | null | undefined | CourseDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$CoursePayload, S>;
export type CourseCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<CourseFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: CourseCountAggregateInputType | true;
};
export interface CourseDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Course'];
        meta: {
            name: 'Course';
        };
    };
    /**
     * Find zero or one Course that matches the filter.
     * @param {CourseFindUniqueArgs} args - Arguments to find a Course
     * @example
     * // Get one Course
     * const course = await prisma.course.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CourseFindUniqueArgs>(args: Prisma.SelectSubset<T, CourseFindUniqueArgs<ExtArgs>>): Prisma.Prisma__CourseClient<runtime.Types.Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one Course that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CourseFindUniqueOrThrowArgs} args - Arguments to find a Course
     * @example
     * // Get one Course
     * const course = await prisma.course.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CourseFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, CourseFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__CourseClient<runtime.Types.Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Course that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFindFirstArgs} args - Arguments to find a Course
     * @example
     * // Get one Course
     * const course = await prisma.course.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CourseFindFirstArgs>(args?: Prisma.SelectSubset<T, CourseFindFirstArgs<ExtArgs>>): Prisma.Prisma__CourseClient<runtime.Types.Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Course that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFindFirstOrThrowArgs} args - Arguments to find a Course
     * @example
     * // Get one Course
     * const course = await prisma.course.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CourseFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, CourseFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__CourseClient<runtime.Types.Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more Courses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Courses
     * const courses = await prisma.course.findMany()
     *
     * // Get first 10 Courses
     * const courses = await prisma.course.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const courseWithIdOnly = await prisma.course.findMany({ select: { id: true } })
     *
     */
    findMany<T extends CourseFindManyArgs>(args?: Prisma.SelectSubset<T, CourseFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a Course.
     * @param {CourseCreateArgs} args - Arguments to create a Course.
     * @example
     * // Create one Course
     * const Course = await prisma.course.create({
     *   data: {
     *     // ... data to create a Course
     *   }
     * })
     *
     */
    create<T extends CourseCreateArgs>(args: Prisma.SelectSubset<T, CourseCreateArgs<ExtArgs>>): Prisma.Prisma__CourseClient<runtime.Types.Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many Courses.
     * @param {CourseCreateManyArgs} args - Arguments to create many Courses.
     * @example
     * // Create many Courses
     * const course = await prisma.course.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends CourseCreateManyArgs>(args?: Prisma.SelectSubset<T, CourseCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many Courses and returns the data saved in the database.
     * @param {CourseCreateManyAndReturnArgs} args - Arguments to create many Courses.
     * @example
     * // Create many Courses
     * const course = await prisma.course.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Courses and only return the `id`
     * const courseWithIdOnly = await prisma.course.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends CourseCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, CourseCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a Course.
     * @param {CourseDeleteArgs} args - Arguments to delete one Course.
     * @example
     * // Delete one Course
     * const Course = await prisma.course.delete({
     *   where: {
     *     // ... filter to delete one Course
     *   }
     * })
     *
     */
    delete<T extends CourseDeleteArgs>(args: Prisma.SelectSubset<T, CourseDeleteArgs<ExtArgs>>): Prisma.Prisma__CourseClient<runtime.Types.Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one Course.
     * @param {CourseUpdateArgs} args - Arguments to update one Course.
     * @example
     * // Update one Course
     * const course = await prisma.course.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends CourseUpdateArgs>(args: Prisma.SelectSubset<T, CourseUpdateArgs<ExtArgs>>): Prisma.Prisma__CourseClient<runtime.Types.Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more Courses.
     * @param {CourseDeleteManyArgs} args - Arguments to filter Courses to delete.
     * @example
     * // Delete a few Courses
     * const { count } = await prisma.course.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends CourseDeleteManyArgs>(args?: Prisma.SelectSubset<T, CourseDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Courses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Courses
     * const course = await prisma.course.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends CourseUpdateManyArgs>(args: Prisma.SelectSubset<T, CourseUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Courses and returns the data updated in the database.
     * @param {CourseUpdateManyAndReturnArgs} args - Arguments to update many Courses.
     * @example
     * // Update many Courses
     * const course = await prisma.course.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Courses and only return the `id`
     * const courseWithIdOnly = await prisma.course.updateManyAndReturn({
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
    updateManyAndReturn<T extends CourseUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, CourseUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one Course.
     * @param {CourseUpsertArgs} args - Arguments to update or create a Course.
     * @example
     * // Update or create a Course
     * const course = await prisma.course.upsert({
     *   create: {
     *     // ... data to create a Course
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Course we want to update
     *   }
     * })
     */
    upsert<T extends CourseUpsertArgs>(args: Prisma.SelectSubset<T, CourseUpsertArgs<ExtArgs>>): Prisma.Prisma__CourseClient<runtime.Types.Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of Courses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseCountArgs} args - Arguments to filter Courses to count.
     * @example
     * // Count the number of Courses
     * const count = await prisma.course.count({
     *   where: {
     *     // ... the filter for the Courses we want to count
     *   }
     * })
    **/
    count<T extends CourseCountArgs>(args?: Prisma.Subset<T, CourseCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], CourseCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a Course.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CourseAggregateArgs>(args: Prisma.Subset<T, CourseAggregateArgs>): Prisma.PrismaPromise<GetCourseAggregateType<T>>;
    /**
     * Group by Course.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseGroupByArgs} args - Group by arguments.
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
    groupBy<T extends CourseGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: CourseGroupByArgs['orderBy'];
    } : {
        orderBy?: CourseGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, CourseGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCourseGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Course model
     */
    readonly fields: CourseFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for Course.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__CourseClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    creator<T extends Prisma.AdminDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AdminDefaultArgs<ExtArgs>>): Prisma.Prisma__AdminClient<runtime.Types.Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    tutor<T extends Prisma.Course$tutorArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Course$tutorArgs<ExtArgs>>): Prisma.Prisma__AdminClient<runtime.Types.Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    category<T extends Prisma.Course$categoryArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Course$categoryArgs<ExtArgs>>): Prisma.Prisma__CategoryClient<runtime.Types.Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    enrollments<T extends Prisma.Course$enrollmentsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Course$enrollmentsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$EnrollmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    modules<T extends Prisma.Course$modulesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Course$modulesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CourseModulePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    materials<T extends Prisma.Course$materialsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Course$materialsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MaterialPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    assignments<T extends Prisma.Course$assignmentsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Course$assignmentsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AssignmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    reviews<T extends Prisma.Course$reviewsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Course$reviewsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
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
 * Fields of the Course model
 */
export interface CourseFieldRefs {
    readonly id: Prisma.FieldRef<"Course", 'String'>;
    readonly title: Prisma.FieldRef<"Course", 'String'>;
    readonly description: Prisma.FieldRef<"Course", 'String'>;
    readonly thumbnail: Prisma.FieldRef<"Course", 'String'>;
    readonly price: Prisma.FieldRef<"Course", 'Float'>;
    readonly duration: Prisma.FieldRef<"Course", 'Int'>;
    readonly level: Prisma.FieldRef<"Course", 'String'>;
    readonly status: Prisma.FieldRef<"Course", 'CourseStatus'>;
    readonly isPublic: Prisma.FieldRef<"Course", 'Boolean'>;
    readonly creatorId: Prisma.FieldRef<"Course", 'String'>;
    readonly tutorId: Prisma.FieldRef<"Course", 'String'>;
    readonly categoryId: Prisma.FieldRef<"Course", 'String'>;
    readonly tutorName: Prisma.FieldRef<"Course", 'String'>;
    readonly requirements: Prisma.FieldRef<"Course", 'String[]'>;
    readonly prerequisites: Prisma.FieldRef<"Course", 'String[]'>;
    readonly rejectionReason: Prisma.FieldRef<"Course", 'String'>;
    readonly rejectedAt: Prisma.FieldRef<"Course", 'DateTime'>;
    readonly createdAt: Prisma.FieldRef<"Course", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Course", 'DateTime'>;
}
/**
 * Course findUnique
 */
export type CourseFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: Prisma.CourseSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Course
     */
    omit?: Prisma.CourseOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CourseInclude<ExtArgs> | null;
    /**
     * Filter, which Course to fetch.
     */
    where: Prisma.CourseWhereUniqueInput;
};
/**
 * Course findUniqueOrThrow
 */
export type CourseFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: Prisma.CourseSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Course
     */
    omit?: Prisma.CourseOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CourseInclude<ExtArgs> | null;
    /**
     * Filter, which Course to fetch.
     */
    where: Prisma.CourseWhereUniqueInput;
};
/**
 * Course findFirst
 */
export type CourseFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: Prisma.CourseSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Course
     */
    omit?: Prisma.CourseOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CourseInclude<ExtArgs> | null;
    /**
     * Filter, which Course to fetch.
     */
    where?: Prisma.CourseWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Courses to fetch.
     */
    orderBy?: Prisma.CourseOrderByWithRelationInput | Prisma.CourseOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Courses.
     */
    cursor?: Prisma.CourseWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Courses from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Courses.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Courses.
     */
    distinct?: Prisma.CourseScalarFieldEnum | Prisma.CourseScalarFieldEnum[];
};
/**
 * Course findFirstOrThrow
 */
export type CourseFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: Prisma.CourseSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Course
     */
    omit?: Prisma.CourseOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CourseInclude<ExtArgs> | null;
    /**
     * Filter, which Course to fetch.
     */
    where?: Prisma.CourseWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Courses to fetch.
     */
    orderBy?: Prisma.CourseOrderByWithRelationInput | Prisma.CourseOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Courses.
     */
    cursor?: Prisma.CourseWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Courses from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Courses.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Courses.
     */
    distinct?: Prisma.CourseScalarFieldEnum | Prisma.CourseScalarFieldEnum[];
};
/**
 * Course findMany
 */
export type CourseFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: Prisma.CourseSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Course
     */
    omit?: Prisma.CourseOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CourseInclude<ExtArgs> | null;
    /**
     * Filter, which Courses to fetch.
     */
    where?: Prisma.CourseWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Courses to fetch.
     */
    orderBy?: Prisma.CourseOrderByWithRelationInput | Prisma.CourseOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Courses.
     */
    cursor?: Prisma.CourseWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Courses from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Courses.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Courses.
     */
    distinct?: Prisma.CourseScalarFieldEnum | Prisma.CourseScalarFieldEnum[];
};
/**
 * Course create
 */
export type CourseCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: Prisma.CourseSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Course
     */
    omit?: Prisma.CourseOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CourseInclude<ExtArgs> | null;
    /**
     * The data needed to create a Course.
     */
    data: Prisma.XOR<Prisma.CourseCreateInput, Prisma.CourseUncheckedCreateInput>;
};
/**
 * Course createMany
 */
export type CourseCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many Courses.
     */
    data: Prisma.CourseCreateManyInput | Prisma.CourseCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * Course createManyAndReturn
 */
export type CourseCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: Prisma.CourseSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Course
     */
    omit?: Prisma.CourseOmit<ExtArgs> | null;
    /**
     * The data used to create many Courses.
     */
    data: Prisma.CourseCreateManyInput | Prisma.CourseCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CourseIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * Course update
 */
export type CourseUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: Prisma.CourseSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Course
     */
    omit?: Prisma.CourseOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CourseInclude<ExtArgs> | null;
    /**
     * The data needed to update a Course.
     */
    data: Prisma.XOR<Prisma.CourseUpdateInput, Prisma.CourseUncheckedUpdateInput>;
    /**
     * Choose, which Course to update.
     */
    where: Prisma.CourseWhereUniqueInput;
};
/**
 * Course updateMany
 */
export type CourseUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update Courses.
     */
    data: Prisma.XOR<Prisma.CourseUpdateManyMutationInput, Prisma.CourseUncheckedUpdateManyInput>;
    /**
     * Filter which Courses to update
     */
    where?: Prisma.CourseWhereInput;
    /**
     * Limit how many Courses to update.
     */
    limit?: number;
};
/**
 * Course updateManyAndReturn
 */
export type CourseUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: Prisma.CourseSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Course
     */
    omit?: Prisma.CourseOmit<ExtArgs> | null;
    /**
     * The data used to update Courses.
     */
    data: Prisma.XOR<Prisma.CourseUpdateManyMutationInput, Prisma.CourseUncheckedUpdateManyInput>;
    /**
     * Filter which Courses to update
     */
    where?: Prisma.CourseWhereInput;
    /**
     * Limit how many Courses to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CourseIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * Course upsert
 */
export type CourseUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: Prisma.CourseSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Course
     */
    omit?: Prisma.CourseOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CourseInclude<ExtArgs> | null;
    /**
     * The filter to search for the Course to update in case it exists.
     */
    where: Prisma.CourseWhereUniqueInput;
    /**
     * In case the Course found by the `where` argument doesn't exist, create a new Course with this data.
     */
    create: Prisma.XOR<Prisma.CourseCreateInput, Prisma.CourseUncheckedCreateInput>;
    /**
     * In case the Course was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.CourseUpdateInput, Prisma.CourseUncheckedUpdateInput>;
};
/**
 * Course delete
 */
export type CourseDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: Prisma.CourseSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Course
     */
    omit?: Prisma.CourseOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CourseInclude<ExtArgs> | null;
    /**
     * Filter which Course to delete.
     */
    where: Prisma.CourseWhereUniqueInput;
};
/**
 * Course deleteMany
 */
export type CourseDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Courses to delete
     */
    where?: Prisma.CourseWhereInput;
    /**
     * Limit how many Courses to delete.
     */
    limit?: number;
};
/**
 * Course.tutor
 */
export type Course$tutorArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: Prisma.AdminSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Admin
     */
    omit?: Prisma.AdminOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AdminInclude<ExtArgs> | null;
    where?: Prisma.AdminWhereInput;
};
/**
 * Course.category
 */
export type Course$categoryArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: Prisma.CategorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Category
     */
    omit?: Prisma.CategoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CategoryInclude<ExtArgs> | null;
    where?: Prisma.CategoryWhereInput;
};
/**
 * Course.enrollments
 */
export type Course$enrollmentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Enrollment
     */
    select?: Prisma.EnrollmentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Enrollment
     */
    omit?: Prisma.EnrollmentOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.EnrollmentInclude<ExtArgs> | null;
    where?: Prisma.EnrollmentWhereInput;
    orderBy?: Prisma.EnrollmentOrderByWithRelationInput | Prisma.EnrollmentOrderByWithRelationInput[];
    cursor?: Prisma.EnrollmentWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.EnrollmentScalarFieldEnum | Prisma.EnrollmentScalarFieldEnum[];
};
/**
 * Course.modules
 */
export type Course$modulesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseModule
     */
    select?: Prisma.CourseModuleSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CourseModule
     */
    omit?: Prisma.CourseModuleOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CourseModuleInclude<ExtArgs> | null;
    where?: Prisma.CourseModuleWhereInput;
    orderBy?: Prisma.CourseModuleOrderByWithRelationInput | Prisma.CourseModuleOrderByWithRelationInput[];
    cursor?: Prisma.CourseModuleWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CourseModuleScalarFieldEnum | Prisma.CourseModuleScalarFieldEnum[];
};
/**
 * Course.materials
 */
export type Course$materialsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Material
     */
    select?: Prisma.MaterialSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Material
     */
    omit?: Prisma.MaterialOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MaterialInclude<ExtArgs> | null;
    where?: Prisma.MaterialWhereInput;
    orderBy?: Prisma.MaterialOrderByWithRelationInput | Prisma.MaterialOrderByWithRelationInput[];
    cursor?: Prisma.MaterialWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MaterialScalarFieldEnum | Prisma.MaterialScalarFieldEnum[];
};
/**
 * Course.assignments
 */
export type Course$assignmentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Assignment
     */
    select?: Prisma.AssignmentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Assignment
     */
    omit?: Prisma.AssignmentOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AssignmentInclude<ExtArgs> | null;
    where?: Prisma.AssignmentWhereInput;
    orderBy?: Prisma.AssignmentOrderByWithRelationInput | Prisma.AssignmentOrderByWithRelationInput[];
    cursor?: Prisma.AssignmentWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AssignmentScalarFieldEnum | Prisma.AssignmentScalarFieldEnum[];
};
/**
 * Course.reviews
 */
export type Course$reviewsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: Prisma.ReviewSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Review
     */
    omit?: Prisma.ReviewOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ReviewInclude<ExtArgs> | null;
    where?: Prisma.ReviewWhereInput;
    orderBy?: Prisma.ReviewOrderByWithRelationInput | Prisma.ReviewOrderByWithRelationInput[];
    cursor?: Prisma.ReviewWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ReviewScalarFieldEnum | Prisma.ReviewScalarFieldEnum[];
};
/**
 * Course without action
 */
export type CourseDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: Prisma.CourseSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Course
     */
    omit?: Prisma.CourseOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CourseInclude<ExtArgs> | null;
};
