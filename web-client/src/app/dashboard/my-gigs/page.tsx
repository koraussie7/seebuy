// app/dashboard/my-gigs/page.tsx - 내가 올린 gig + 내가 수락한 gig
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { apiFetch } from '@/lib/apiClient';

interface Task {
    id: string;
    title: string;
    description: string;
    price: number;
    status: string;
    address?: string;
    client?: { firstName: string; lastName: string; phone?: string };
    updatedAt: string;
}

export default function MyGigsPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            router.push('/login');
            return;
        }
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            setCurrentUserId(u.id || null);
        } catch { /* ignore */ }

        const load = async () => {
            try {
                const data = await apiFetch<{ tasks: Task[] }>('/api/tasks/my-gigs');
                setTasks(data.tasks);
            } catch (err) {
                toast.error((err as Error).message || '내 gigs를 불러오지 못했습니다');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [router]);

    const handleComplete = async (id: string) => {
        try {
            await apiFetch(`/api/tasks/${id}/complete`, { method: 'PUT' });
            toast.success('완료로 표시되었습니다!');
            setTasks((prev) => prev.filter((t) => t.id !== id));
        } catch (err) {
            toast.error((err as Error).message || '완료 처리 실패');
        }
    };

    const statusColor: Record<string, string> = {
        OPEN: 'bg-green-100 text-green-800',
        ASSIGNED: 'bg-yellow-100 text-yellow-800',
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster />
            <nav className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="text-blue-600 hover:underline text-sm font-medium">← 대시보드</Link>
                    <h1 className="text-lg font-bold text-gray-900">내 Gigs</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto px-4 py-8">
                {tasks.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                        수락한 gig이 없습니다. 대시보드 지도에서 gig을 찾아보세요.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map((t) => (
                            <div key={t.id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <Link href={`/dashboard/task/${t.id}`} className="text-lg font-bold text-gray-900 hover:text-blue-600">
                                        {t.title}
                                    </Link>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusColor[t.status] || 'bg-gray-100 text-gray-700'}`}>
                                        {t.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{t.description}</p>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                    <span className="bg-green-50 text-green-700 font-bold px-3 py-1 rounded">${t.price}</span>
                                    {t.client && <span>의뢰자: {t.client.firstName}{t.client.phone ? ` (${t.client.phone})` : ''}</span>}
                                    {t.address && <span>{t.address}</span>}
                                    <button onClick={() => handleComplete(t.id)} className="ml-auto bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors">
                                        완료하기
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
