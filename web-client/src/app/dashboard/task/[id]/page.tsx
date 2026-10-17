// app/dashboard/task/[id]/page.tsx - 태스크 상세 + 수락/완료 + 리뷰
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { apiFetch } from '@/lib/apiClient';

interface Task {
    id: string;
    title: string;
    description: string;
    price: number;
    status: string;
    latitude: number;
    longitude: number;
    address?: string;
    clientId: string;
    providerId?: string;
    client?: { firstName: string; lastName: string; email: string };
    provider?: { firstName: string; lastName: string };
    createdAt: string;
}

interface Review {
    id: string;
    rating: number;
    comment?: string;
    author: { firstName: string; lastName: string };
    subject: { firstName: string; lastName: string };
}

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [task, setTask] = useState<Task | null>(null);
    const [review, setReview] = useState<Review | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const fetchTask = async () => {
        try {
            const data = await apiFetch<{ task: Task }>(`/api/tasks/${id}`);
            setTask(data.task);
        } catch (err) {
            toast.error((err as Error).message || '태스크를 불러오지 못했습니다');
        } finally {
            setLoading(false);
        }
    };

    const fetchReview = async () => {
        try {
            const data = await apiFetch<{ review: Review }>(`/api/reviews/task/${id}`);
            setReview(data.review);
        } catch { /* 리뷰 없음(404)은 무시 */ }
    };

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const u = JSON.parse(userData);
                setCurrentUserId(u.id || null);
            } catch { /* ignore */ }
        }
        if (!localStorage.getItem('token')) {
            router.push('/login');
            return;
        }
        fetchTask();
        fetchReview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleAccept = async () => {
        setActionLoading(true);
        try {
            await apiFetch(`/api/tasks/${id}/accept`, { method: 'PUT' });
            toast.success('기가 수락되었습니다!');
            fetchTask();
        } catch (err) {
            toast.error((err as Error).message || '수락 실패');
        } finally {
            setActionLoading(false);
        }
    };

    const handleComplete = async () => {
        setActionLoading(true);
        try {
            await apiFetch(`/api/tasks/${id}/complete`, { method: 'PUT' });
            toast.success('태스크가 완료되었습니다!');
            fetchTask();
        } catch (err) {
            toast.error((err as Error).message || '완료 처리 실패');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await apiFetch(`/api/reviews/${id}`, {
                method: 'POST',
                body: JSON.stringify({ rating, comment }),
            });
            toast.success('리뷰가 등록되었습니다!');
            setComment('');
            fetchReview();
        } catch (err) {
            toast.error((err as Error).message || '리뷰 등록 실패');
        } finally {
            setActionLoading(false);
        }
    };

    const isOwner = currentUserId && task?.clientId === currentUserId;
    const isProvider = currentUserId && task?.providerId === currentUserId;

    const statusColor: Record<string, string> = {
        OPEN: 'bg-green-100 text-green-800',
        ASSIGNED: 'bg-yellow-100 text-yellow-800',
        IN_PROGRESS: 'bg-blue-100 text-blue-800',
        COMPLETED: 'bg-gray-200 text-gray-700',
        CANCELLED: 'bg-red-100 text-red-800',
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
                <p className="text-gray-600">태스크를 찾을 수 없습니다.</p>
                <Link href="/dashboard" className="text-blue-600 hover:underline">대시보드로 돌아가기</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster />
            <nav className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="text-blue-600 hover:underline text-sm font-medium">대시보드</Link>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/my-gigs" className="text-sm text-gray-600 hover:text-gray-900">내 Gigs</Link>
                        <h1 className="text-lg font-bold text-gray-900">GigMarket</h1>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusColor[task.status] || 'bg-gray-100 text-gray-700'}`}>
                            {task.status}
                        </span>
                    </div>
                    <p className="text-gray-600 mb-4">{task.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        <span className="bg-green-50 text-green-700 font-bold px-3 py-1 rounded">${task.price}</span>
                        {task.address && <span>{task.address}</span>}
                        <span>의뢰자: {task.client ? `${task.client.firstName} ${task.client.lastName}` : '알 수 없음'}</span>
                        {task.provider && <span>수행자: {task.provider.firstName} {task.provider.lastName}</span>}
                        <span>{new Date(task.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>

                    <div className="flex gap-3 mt-6">
                        {task.status === 'OPEN' && !isOwner && (
                            <button onClick={handleAccept} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors">
                                {actionLoading ? '처리 중...' : '이 Gig 수락하기'}
                            </button>
                        )}
                        {task.status === 'ASSIGNED' && isProvider && (
                            <button onClick={handleComplete} disabled={actionLoading} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors">
                                {actionLoading ? '처리 중...' : '완료로 표시하기'}
                            </button>
                        )}
                        {isOwner && task.status === 'OPEN' && (
                            <span className="text-sm text-gray-400 self-center">내가 올린 gig입니다. 수락 대기 중...</span>
                        )}
                    </div>
                </div>


                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">리뷰</h3>
                    {review ? (
                        <div className="border-l-4 border-yellow-400 pl-4 py-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-yellow-500 font-bold">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                <span className="text-sm text-gray-500">{review.rating}/5</span>
                            </div>
                            {review.comment && <p className="text-gray-700">{review.comment}</p>}
                            <p className="text-xs text-gray-400 mt-2">{review.author.firstName} → {review.subject.firstName}</p>
                        </div>
                    ) : task.status === 'COMPLETED' && isOwner ? (
                        <form onSubmit={handleReview} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">평점</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button key={n} type="button" onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">코멘트</label>
                                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="수행자는 어땠나요?" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <button type="submit" disabled={actionLoading} className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors">
                                {actionLoading ? '등록 중...' : '리뷰 등록하기'}
                            </button>
                        </form>
                    ) : (
                        <p className="text-sm text-gray-400">아직 등록된 리뷰가 없습니다. {task.status !== 'COMPLETED' && '(태스크 완료 후 리뷰를 남길 수 있습니다)'}</p>
                    )}
                </div>
            </main>
        </div>
    );
}
