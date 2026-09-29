'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  level: string;
  duration: number;
  averageRating: number;
  tutorName?: string;
  isEnrolled: boolean;
  hasReviewed?: boolean;
  enrollmentStatus?: string;
  progressPercentage?: number;
  hasNewContent?: boolean;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
  _count: {
    enrollments: number;
    materials: number;
    reviews: number;
  };
}

interface Enrollment {
  id: string;
  courseId: string;
  progressPercentage: number;
  status: string;
  enrolledAt: string;
  completedAt?: string;
  hasReviewed?: boolean;
  completedMaterials: number;
  totalTimeSpent: number;
  hasNewContent?: boolean;
  course: Course;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeStudents: 0,
    completedCourses: 0,
    totalHours: 0,
    averageRating: 0,
  });
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // Gates the single orchestrated motion on this page: progress bars draw once.
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!isLoading) {
      const id = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(id);
    }
  }, [isLoading]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const platformStatsResponse = await api.platform.getStats();
      if (platformStatsResponse.success && platformStatsResponse.data) {
        setStats((prev) => ({
          ...prev,
          totalCourses: platformStatsResponse.data.totalCourses || 0,
          activeStudents: platformStatsResponse.data.totalStudents || 0,
          averageRating: platformStatsResponse.data.averageRating || 0,
        }));
      }

      const coursesResponse = await api.courses.getAll({ limit: 8 });
      if (coursesResponse.success && coursesResponse.data) {
        setFeaturedCourses(coursesResponse.data.courses || []);
      }

      if (user) {
        try {
          const allEnrollmentsResponse = await api.enrollments.getMy({ limit: 1000 });
          if (allEnrollmentsResponse.success) {
            const allEnrolls = allEnrollmentsResponse.data.enrollments || [];
            setAllEnrollments(allEnrolls);
            setStats((prev) => ({
              ...prev,
              completedCourses: allEnrolls.filter(
                (e: any) => e.status === 'COMPLETED' || (e.progressPercentage ?? 0) >= 100
              ).length,
              totalHours: Math.round(
                allEnrolls.reduce((total: number, e: any) => total + (e.totalTimeSpent || 0), 0) / 60
              ),
            }));
          }

          const enrollmentsResponse = await api.enrollments.getMy({ limit: 8 });
          if (enrollmentsResponse.success) {
            setMyEnrollments(enrollmentsResponse.data.enrollments || []);
          }
        } catch (error) {
        }
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/courses?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const getCourseButtonState = (course: Course) => {
    if (!course.isEnrolled) {
      return { text: 'View course', href: `/courses/${course.id}` };
    }

    const isCompleted =
      course.enrollmentStatus === 'COMPLETED' ||
      (course.progressPercentage && course.progressPercentage >= 100);

    if (isCompleted) {
      if (course.hasNewContent) {
        return { text: 'View new content', href: `/learn/${course.id}` };
      }
      if (course.hasReviewed) {
        return { text: 'View contents', href: `/courses/${course.id}` };
      }
      return { text: 'Rate course', href: `/courses/${course.id}/rate` };
    }
    return { text: 'Continue learning', href: `/learn/${course.id}` };
  };

  const getEnrollmentButtonState = (enrollment: Enrollment) => {
    const isCompleted =
      (enrollment.progressPercentage ?? 0) >= 100 || enrollment.status === 'COMPLETED';
    const courseId = enrollment.course?.id || enrollment.courseId;

    if (isCompleted) {
      if (enrollment.hasNewContent) {
        return { text: 'View new content', href: `/learn/${courseId}`, type: 'new-content' };
      }
      if (enrollment.hasReviewed) {
        return { text: 'View contents', href: `/courses/${courseId}`, type: 'completed' };
      }
      return { text: 'Rate course', href: `/courses/${courseId}/rate`, type: 'rate' };
    }
    return { text: 'Continue learning', href: `/learn/${courseId}`, type: 'continue' };
  };

  /** The learner's nearest unfinished course — the one thing the hero is built around. */
  const resumePoint = myEnrollments.find(
    (e) => e.status !== 'COMPLETED' && (e.progressPercentage ?? 0) < 100
  );

  const inProgressCount = allEnrollments.filter(
    (e) => e.status !== 'COMPLETED' && (e.progressPercentage ?? 0) < 100
  ).length;

  if (authLoading) {
    return (
      <div className={'min-h-screen bg-white flex items-center justify-center'}>
        <div className="h-px w-24 bg-[#1D4ED8]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <style>{`
        @keyframes draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @media (prefers-reduced-motion: reduce) {
          .bar { transition: none !important; }
        }
      `}</style>

      {/* ---------------------------------------------------------------- hero */}
      <section className="border-b border-[#DDE3EA] bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            <div>
              {user ? (
                <>
                  <h1 className="font-display text-h1 sm:text-display">
                    Welcome back, {user.firstName}!
                  </h1>
                  <p className="mt-4 max-w-[52ch] text-lead text-[#475569]">
                    {resumePoint
                      ? 'Continue your learning journey with our professional courses designed for career growth.'
                      : 'Pick your next course and keep building toward your goals.'}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="font-display text-h1 sm:text-display">
                    Advance Your Career with Expert-Led Courses
                  </h1>
                  <p className="mt-4 max-w-[52ch] text-lead text-[#475569]">
                    Access{' '}
                    {stats.totalCourses > 0 ? `${stats.totalCourses}+ courses` : 'premium courses'}{' '}
                    from industry experts and transform your career.
                  </p>
                </>
              )}

              {/* Search is the main way into the catalogue, so it is a real
                  control rather than a typographic flourish. */}
              <form onSubmit={handleSearch} className="mt-8 max-w-xl">
                <label htmlFor="course-search" className="sr-only">
                  Search courses
                </label>
                <div className="flex items-stretch rounded-[6px] border border-[#DDE3EA] bg-white transition-colors focus-within:border-[#1D4ED8] focus-within:ring-2 focus-within:ring-[#1D4ED8]/15">
                  <MagnifyingGlassIcon className="ml-3.5 h-5 w-5 flex-shrink-0 self-center text-[#94A3B8]" />
                  <input
                    id="course-search"
                    type="text"
                    // An input defaults to size=20, an intrinsic width of roughly
                    // 200px that min-w-0 does not remove. It inflated this flex
                    // row's min-content to 326px, which forced the hero grid
                    // column wider than a 320px viewport.
                    size={1}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Python, React, data structures…"
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-body text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="m-1 flex-shrink-0 rounded-[4px] bg-[#1D4ED8] px-5 text-ui font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                  >
                    Search
                  </button>
                </div>
              </form>

              {!user && (
                <Link
                  href="/register"
                  className="mt-6 inline-flex items-center text-body font-semibold text-[#1D4ED8] underline decoration-[#C7D2DE] underline-offset-4 transition-colors hover:decoration-[#1D4ED8]"
                >
                  Create an account
                </Link>
              )}
            </div>

            {/* the figures, as a ledger rather than four tiles */}
            <dl className="rounded-[6px] border border-[#DDE3EA] bg-[#F6F8FA] px-6 py-2 lg:self-start">
              {(user
                ? [
                    { k: 'In progress', v: String(inProgressCount), lead: true },
                    { k: 'Completed', v: String(stats.completedCourses) },
                    { k: 'Hours learned', v: `${stats.totalHours}` },
                  ]
                : [
                    { k: 'Courses', v: String(stats.totalCourses || 0), lead: true },
                    {
                      k: 'Learners',
                      v: stats.activeStudents > 0 ? stats.activeStudents.toLocaleString() : '—',
                    },
                    {
                      k: 'Average rating',
                      v: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—',
                    },
                  ]
              ).map((row) => (
                <div
                  key={row.k}
                  className="flex items-baseline justify-between border-b border-[#DDE3EA] py-4 last:border-b-0"
                >
                  <dt className="text-ui text-[#475569]">{row.k}</dt>
                  <dd
                    className={`tabular-nums leading-none ${
                      row.lead
                        ? 'text-[34px] font-semibold text-[#1D4ED8]'
                        : 'text-[26px] font-medium text-[#0F172A]'
                    }`}
                  >
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* the one bold thing: the exact place to restart */}
      {user && resumePoint && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mt-8 rounded-[6px] border border-[#DDE3EA] border-l-[3px] border-l-[#1D4ED8] bg-[#F6F8FA] p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-title">
                  {resumePoint.course?.title}
                </p>
                <p className="mt-1.5 text-ui text-[#475569]">
                  {resumePoint.completedMaterials} of{' '}
                  {resumePoint.course?._count?.materials ?? 0} lessons done
                </p>
                <div className="mt-4 flex max-w-md items-center gap-3">
                  <div className="h-[4px] flex-1 rounded-full bg-[#DDE3EA]">
                    <div
                      className="bar h-full origin-left rounded-full bg-[#1D4ED8] transition-transform duration-[900ms] ease-out"
                      style={{
                        width: `${Math.min(100, Math.round(resumePoint.progressPercentage ?? 0))}%`,
                        transform: revealed ? 'scaleX(1)' : 'scaleX(0)',
                      }}
                    />
                  </div>
                  <span className="text-ui font-medium tabular-nums text-[#1D4ED8]">
                    {Math.round(resumePoint.progressPercentage ?? 0)}%
                  </span>
                </div>
              </div>

              <Link
                href={`/learn/${resumePoint.course?.id || resumePoint.courseId}`}
                className="inline-flex flex-shrink-0 items-center justify-center rounded-[4px] bg-[#1D4ED8] px-7 py-3 text-body font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
              >
                Resume
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ------------------------------------------------------ continue */}
        {user && myEnrollments.length > 0 && (
          <section className="pt-14 sm:pt-16">
            <div className="flex items-baseline justify-between">
              <h2 className="text-title">Continue Learning</h2>
              <Link
                href="/my-courses"
                className="text-ui font-medium text-[#475569] underline decoration-[#C7D2DE] underline-offset-4 transition-colors hover:text-[#0F172A] hover:decoration-[#1D4ED8]"
              >
                See all
              </Link>
            </div>

            <ul className="mt-6 border-t border-[#DDE3EA]">
              {myEnrollments.slice(0, 4).map((enrollment) => {
                const pct = Math.min(100, Math.round(enrollment.progressPercentage ?? 0));
                const state = getEnrollmentButtonState(enrollment);
                const done = pct >= 100;

                return (
                  <li
                    key={enrollment.id}
                    className="grid grid-cols-1 items-center gap-4 border-b border-[#DDE3EA] py-5 sm:grid-cols-[1fr_180px_auto] sm:gap-8"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium">
                        {enrollment.course?.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                        <p className="text-caption text-[#475569]">
                          {enrollment.completedMaterials} of{' '}
                          {enrollment.course?._count?.materials ?? 0} lessons
                        </p>
                        {enrollment.hasNewContent && (
                          <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#B45309] px-2 py-0.5 text-[11px] font-semibold text-white">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                            New material
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-[3px] flex-1 bg-[#DDE3EA]">
                        <div
                          className={`bar h-full origin-left transition-transform duration-[900ms] ease-out ${
                            done ? 'bg-[#0F172A]' : 'bg-[#1D4ED8]'
                          }`}
                          style={{
                            width: `${pct}%`,
                            transform: revealed ? 'scaleX(1)' : 'scaleX(0)',
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-caption tabular-nums text-[#475569]">
                        {pct}%
                      </span>
                    </div>

                    <Link
                      href={state.href}
                      className="justify-self-start rounded-[3px] bg-[#0F172A] px-4 py-2 text-caption font-semibold text-[#FFFFFF] transition-colors hover:bg-[#1E40AF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A] sm:justify-self-end"
                    >
                      {state.text}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* ----------------------------------------------------- catalogue */}
        <section className="py-14 sm:py-16">
          <div className="flex items-baseline justify-between">
            <h2 className="text-title">Featured Courses</h2>
            <Link
              href="/courses"
              className="text-ui font-medium text-[#475569] underline decoration-[#C7D2DE] underline-offset-4 transition-colors hover:text-[#0F172A] hover:decoration-[#1D4ED8]"
            >
              See all
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="overflow-hidden rounded-[6px] border border-[#DDE3EA]">
                  <div className="aspect-[16/10] w-full bg-[#F6F8FA]" />
                  <div className="p-4">
                    <div className="h-4 w-3/4 rounded bg-[#F6F8FA]" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-[#F6F8FA]" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredCourses.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCourses.map((course) => {
                const state = getCourseButtonState(course);
                const pct = Math.round(course.progressPercentage ?? 0);

                return (
                  <article
                    key={course.id}
                    className="group flex h-full flex-col overflow-hidden rounded-[6px] border border-[#DDE3EA] bg-white transition-colors hover:border-[#1D4ED8]"
                  >
                    <Link
                      href={`/courses/${course.id}`}
                      className="block focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1D4ED8]"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F6F8FA]">
                        {course.thumbnail ? (
                          <>
                            <img
                              src={course.thumbnail}
                              alt=""
                              aria-hidden="true"
                              className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl opacity-45"
                            />
                            <img
                              src={course.thumbnail}
                              alt=""
                              className="relative h-full w-full object-contain"
                            />
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-caption text-[#64748B]">No image</span>
                          </div>
                        )}

                        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                          {course.isEnrolled && (
                            <span
                              className={`rounded-[3px] px-2.5 py-1 text-[11px] font-semibold shadow-[0_1px_4px_rgba(15,23,42,0.45)] ${
                                pct >= 100 || course.enrollmentStatus === 'COMPLETED'
                                  ? 'bg-white text-[#0F172A] ring-1 ring-black/5'
                                  : 'bg-[#1D4ED8] text-white'
                              }`}
                            >
                              {pct >= 100 || course.enrollmentStatus === 'COMPLETED'
                                ? 'Completed'
                                : 'Enrolled'}
                            </span>
                          )}

                          {/* Same warm signal the catalogue uses, so "something
                              new to watch" reads identically on both pages. */}
                          {course.hasNewContent && (
                            <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#B45309] px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_1px_4px_rgba(15,23,42,0.45)]">
                              <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                              New material
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="text-body font-semibold leading-snug line-clamp-2">
                        <Link
                          href={`/courses/${course.id}`}
                          className="transition-colors group-hover:text-[#1D4ED8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                        >
                          {course.title}
                        </Link>
                      </h3>

                      <p className="mt-1.5 truncate text-caption text-[#475569]">
                        {course.tutorName ||
                          `${course.creator?.firstName ?? ''} ${course.creator?.lastName ?? ''}`.trim()}
                      </p>

                      <p className="mt-2 text-[12px] tabular-nums text-[#64748B]">
                        {course._count?.materials ?? 0} lessons
                        {(course._count?.enrollments ?? 0) > 0 &&
                          `, ${course._count.enrollments} enrolled`}
                      </p>

                      {course.isEnrolled && pct < 100 && (
                        <div className="mt-3 flex items-center gap-2.5">
                          <div className="h-[3px] flex-1 rounded-full bg-[#E9EEF4]">
                            <div
                              className="bar h-full origin-left rounded-full bg-[#1D4ED8] transition-transform duration-[900ms] ease-out"
                              style={{
                                width: `${pct}%`,
                                transform: revealed ? 'scaleX(1)' : 'scaleX(0)',
                              }}
                            />
                          </div>
                          <span className="text-[12px] font-medium tabular-nums text-[#475569]">
                            {pct}%
                          </span>
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#DDE3EA] pt-3.5">
                        <span className="text-body font-semibold tabular-nums">
                          {course.price > 0 ? `₹${course.price.toLocaleString('en-IN')}` : 'Free'}
                        </span>

                        {/* A filled button means you already have it in progress. */}
                        {course.isEnrolled ? (
                          <Link
                            href={state.href}
                            className="rounded-[4px] bg-[#1D4ED8] px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                          >
                            {state.text}
                          </Link>
                        ) : (
                          <Link
                            href={state.href}
                            className="rounded-[4px] border border-[#DDE3EA] px-3.5 py-2 text-[12px] font-semibold text-[#0F172A] transition-colors hover:border-[#1D4ED8] hover:text-[#1D4ED8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                          >
                            {state.text}
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 border-t border-[#DDE3EA] py-16">
              <p className="text-lead font-medium">No courses published yet</p>
              <p className="mt-2 max-w-[48ch] text-body leading-relaxed text-[#475569]">
                New courses appear here as soon as they go live. In the meantime you can set up your
                profile so you are ready to start.
              </p>
              <Link
                href="/profile"
                className="mt-6 inline-flex items-center rounded-[3px] border border-[#0F172A] px-5 py-2.5 text-ui font-semibold transition-colors hover:bg-[#0F172A] hover:text-[#FFFFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]"
              >
                Go to profile
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
